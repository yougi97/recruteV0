from google import genai
from google.genai import types
import pdfplumber
import json
import re
import os

from config import GEMINI_API_KEY
from schemas import CVParse, Competence, NiveauEtudes, NiveauExpertise

client = genai.Client(api_key=GEMINI_API_KEY)

GEMINI_MODEL_CANDIDATES = [
    model_name.strip()
    for model_name in os.environ.get(
        "GEMINI_MODEL_CANDIDATES",
        "gemini-2.5-flash-lite,gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash",
    ).split(",")
    if model_name.strip()
]

GEMINI_MODEL_SELECTION = os.environ.get("GEMINI_MODEL_SELECTION", "auto").strip().lower()

AUTO_MODEL_PREFERENCE = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite-001",
]

SYSTEM_INSTRUCTION = """Tu es un expert RH. Extrais les informations du CV et retourne uniquement un JSON valide correspondant au schéma fourni.

EXHAUSTIVITÉ DES COMPÉTENCES — RÈGLE PRINCIPALE : sois le plus exhaustif possible sur ce que tu inclus dans "competences". Chaque outil, framework, technologie, langage, domaine, et méthodologie doit apparaître. En plus des compétences explicites, inclus les domaines/champs impliqués par les outils :
  Keras / TensorFlow / PyTorch / scikit-learn / FAISS     → ajouter aussi : Machine Learning, Deep Learning, Intelligence Artificielle
  React / Vue / Angular / Next.js                         → ajouter aussi : JavaScript, HTML, CSS (si absents)
  Angular / NestJS                                        → ajouter aussi : TypeScript (si absent)
  Spring Boot / Spring                                    → ajouter aussi : Java (si absent)
  Django / Flask / FastAPI                                → ajouter aussi : Python (si absent)
  Docker / Kubernetes                                     → ajouter aussi : DevOps (si absent)
  MySQL / PostgreSQL / MongoDB / Redis                    → ajouter aussi : Base de données (si absent)
  AWS / Azure / GCP                                       → ajouter aussi : Cloud (si absent)
  Pandas / NumPy / Jupyter                                → ajouter aussi : Data Science, Python (si absents)
  Android / Kotlin                                        → ajouter aussi : Développement mobile (si absent)
  Applique la même logique à tout autre outil reconnu.
  Ces compétences implicites héritent du même niveau que l'outil source.

NIVEAUX DE COMPÉTENCES — calibrer le NIVEAU strictement (mais ne pas limiter le nombre) :
• notions      : théorie connue mais peu ou jamais pratiquée (cours magistral, tutoriel lu, pas de projet concret)
• intermediaire : pratiqué concrètement dans des projets perso ou académiques (TP, side project, projet uni)
• avance       : utilisé de façon autonome en contexte professionnel réel (stage, CDI, CDD, freelance)
• expert       : maîtrise approfondie après 3+ ans d'usage pro, capacité à former/encadrer d'autres

Calibrage attendu pour un étudiant sans expérience professionnelle :
  - Techno vue uniquement en cours → notions
  - Techno utilisée dans un projet perso/uni → intermediaire
  - Techno utilisée en stage → avance
  - Expert est rarissime pour un étudiant, réserver aux cas évidents (ex: langage natif)

LANGUES — OBLIGATOIRE : inclure chaque langue détectée DANS "competences" (avec niveau CEFR mappé) ET dans "langues" (liste des noms seuls) :
  A1 / A2                       → notions
  B1                            → intermediaire
  B2                            → avance
  C1 / C2 / natif / maternelle  → expert
  Niveau non précisé mais langue pratiquée → intermediaire

Exemples : "Anglais B2" → competence {nom:"Anglais", niveau:"avance"} + langues:["Anglais"]
           "Espagnol A2" → competence {nom:"Espagnol", niveau:"notions"} + langues:["Espagnol"]
           "Français (natif)" → competence {nom:"Français", niveau:"expert"} + langues:["Français"]

FORMATIONS — Remplis "formations" avec les noms complets des programmes/diplômes suivis (ex: "BTS Informatique", "Licence Sciences des Données", "Master Finance de Marché", "DUT Réseaux et Télécom", "BUT Informatique", "École d'ingénieur spécialité Génie Logiciel"). Si plusieurs, les lister tous.

INFÉRENCE DEPUIS LES FORMATIONS — Si le CV mentionne un programme avec un domaine technique identifiable, ajoute les compétences fondamentales de ce domaine avec niveau "notions", UNIQUEMENT si elles ne sont pas déjà présentes dans les compétences explicites du CV. Règles :
  - BTS / DUT / BUT Informatique → SQL, Algorithmique, Programmation orientée objet, Réseau informatique
  - Licence / Master Informatique → ajouter aussi des langages courants du domaine (Python, Java…)
  - BTS Commerce / Management → PowerPoint, Excel, Relation client
  - Master Finance / Comptabilité → Excel, Analyse financière, Comptabilité
  - BTS Électronique / Électrotechnique → Électronique, Schémas électriques
  - Adapter à ce qui est le plus probable pour le programme spécifique mentionné
  - Maximum 5 compétences inférées par formation, seulement si le domaine est clair
  - Ne jamais inventer des compétences sans lien avec le programme

Si une info est absente, utilise null."""


def _available_gemini_models() -> list[str]:
    try:
        response = client.models.list()
    except Exception:
        return []

    available = []
    for model in response:
        name = str(getattr(model, "name", ""))
        short_name = name.split("models/")[-1] if name else ""
        methods = getattr(model, "supported_generation_methods", None) or getattr(model, "supportedGenerationMethods", None) or []
        if short_name and "generateContent" in methods:
            available.append(short_name)
    return available


def _ordered_model_candidates() -> list[str]:
    if GEMINI_MODEL_SELECTION != "auto":
        return GEMINI_MODEL_CANDIDATES

    ordered = []
    for model_name in AUTO_MODEL_PREFERENCE + GEMINI_MODEL_CANDIDATES:
        if model_name not in ordered:
            ordered.append(model_name)
    return ordered


def _parse_with_gemini(prompt: str) -> tuple[CVParse | None, str | None]:
    last_error = None
    for model_name in _ordered_model_candidates():
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=CVParse,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            parsed = CVParse.model_validate_json(response.text)
            parsed.parsing_source = model_name
            return parsed, None
        except Exception as exc:
            last_error = f"{model_name}: {exc}"
    return None, last_error


COMMON_SKILLS = [
    "Python", "Java", "Spring", "Spring Boot", "Angular", "TypeScript", "JavaScript", "React",
    "HTML", "CSS", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Docker", "Git", "Linux", "Unix",
    "Flask", "Django", "FastAPI", "Machine Learning", "Deep Learning", "Data Science", "NLP",
    "Intelligence Artificielle", "TensorFlow", "PyTorch", "Keras", "NumPy", "Pandas", "scikit-learn", "FAISS",
    "Kotlin", "Android", "Swift", "iOS", "C", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Jenkins", "GitLab CI", "OCaml", "Scala",
    "Redis", "Elasticsearch", "GraphQL", "gRPC", "Kafka", "Vue", "Next.js", "NestJS",
]

# tool → implied domain skills (for heuristic fallback — mirrors Gemini SYSTEM_INSTRUCTION)
_SKILL_IMPLICATIONS: dict[str, list[str]] = {
    "keras":          ["Machine Learning", "Deep Learning", "Intelligence Artificielle"],
    "tensorflow":     ["Machine Learning", "Deep Learning", "Intelligence Artificielle"],
    "pytorch":        ["Machine Learning", "Deep Learning", "Intelligence Artificielle"],
    "scikit-learn":   ["Machine Learning", "Intelligence Artificielle"],
    "faiss":          ["Machine Learning", "Intelligence Artificielle"],
    "xgboost":        ["Machine Learning", "Intelligence Artificielle"],
    "pandas":         ["Data Science", "Python"],
    "numpy":          ["Data Science", "Python"],
    "react":          ["JavaScript", "HTML", "CSS"],
    "angular":        ["TypeScript", "JavaScript", "HTML", "CSS"],
    "vue":            ["JavaScript", "HTML", "CSS"],
    "next.js":        ["JavaScript", "React", "HTML"],
    "nestjs":         ["TypeScript", "JavaScript"],
    "spring boot":    ["Java", "Spring"],
    "spring":         ["Java"],
    "django":         ["Python"],
    "flask":          ["Python"],
    "fastapi":        ["Python"],
    "docker":         ["DevOps"],
    "kubernetes":     ["DevOps", "Docker"],
    "android":        ["Kotlin", "Développement mobile"],
    "kotlin":         ["Développement mobile"],
    "swift":          ["iOS", "Développement mobile"],
    "aws":            ["Cloud"],
    "azure":          ["Cloud"],
    "gcp":            ["Cloud"],
    "mysql":          ["SQL", "Base de données"],
    "postgresql":     ["SQL", "Base de données"],
    "mongodb":        ["Base de données"],
    "redis":          ["Base de données"],
}

COMMON_SOFT_SKILLS = [
    "communication", "autonomie", "esprit d'équipe", "rigueur", "adaptabilité", "collaboration",
    "leadership", "organisation", "curiosité", "créativité", "problem solving"
]

LANGUAGE_HINTS = {
    "français": "Français", "anglais": "Anglais", "espagnol": "Espagnol",
    "allemand": "Allemand", "italien": "Italien", "portugais": "Portugais",
    "arabe": "Arabe", "chinois": "Chinois", "japonais": "Japonais",
    "french": "Français", "english": "Anglais", "spanish": "Espagnol",
    "german": "Allemand",
}

# CEFR level → NiveauExpertise mapping for heuristic language detection
_CEFR_RE = re.compile(
    r"\b(a1|a2|b1|b2|c1|c2|natif|native|maternell[a-z]*|bilingue|courant|fluent|professionnel)\b",
    re.IGNORECASE,
)
_CEFR_NIVEAU = {
    "a1": NiveauExpertise.NOTIONS,   "a2": NiveauExpertise.NOTIONS,
    "b1": NiveauExpertise.INTERMEDIAIRE,
    "b2": NiveauExpertise.AVANCE,    "courant": NiveauExpertise.AVANCE,
    "fluent": NiveauExpertise.AVANCE, "professionnel": NiveauExpertise.AVANCE,
    "c1": NiveauExpertise.EXPERT,    "c2": NiveauExpertise.EXPERT,
    "natif": NiveauExpertise.EXPERT, "native": NiveauExpertise.EXPERT,
    "bilingue": NiveauExpertise.EXPERT,
}

def _cefr_niveau_for_lang(lang_lower: str, texte_lower: str) -> NiveauExpertise:
    # Look for a CEFR marker within 60 chars of the language name
    idx = texte_lower.find(lang_lower)
    if idx == -1:
        return NiveauExpertise.INTERMEDIAIRE
    window = texte_lower[max(0, idx - 30): idx + len(lang_lower) + 60]
    m = _CEFR_RE.search(window)
    if m:
        return _CEFR_NIVEAU.get(m.group(1).lower(), NiveauExpertise.INTERMEDIAIRE)
    return NiveauExpertise.INTERMEDIAIRE


def extraire_texte_pdf(chemin: str) -> str:
    with pdfplumber.open(chemin) as pdf:
        texte = "\n".join(p.extract_text() or "" for p in pdf.pages)

    if len(texte.strip()) >= 100:
        return texte

    # Scanned PDF — render each page and OCR
    try:
        import fitz  # PyMuPDF
        import pytesseract
        from PIL import Image

        doc = fitz.open(chemin)
        pages = []
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            try:
                pages.append(pytesseract.image_to_string(img, lang="fra+eng"))
            except Exception:
                pages.append(pytesseract.image_to_string(img))
        ocr_text = "\n".join(pages)
        return ocr_text if ocr_text.strip() else texte
    except Exception:
        return texte


# French educational programs → likely skills (notions level, conservative list)
_FORMATION_SKILLS: list[tuple[re.Pattern, str, list[str]]] = [
    (re.compile(r"\bsti2d\b|\bsyst[eè]me\s+d.information\s+num[eé]rique\b", re.I),
     "Baccalauréat STI2D SIN",
     ["Algorithmique", "Réseau informatique", "Électronique numérique", "Python"]),
    (re.compile(r"\btsi\b|\bpr[eé]pa\s+tsi\b", re.I),
     "Classe préparatoire TSI",
     ["Algorithmique", "C", "Sciences industrielles", "Mathématiques"]),
    (re.compile(r"\bepf\b|\b[eé]cole\s+d.ing[eé]ni", re.I),
     "École d'ingénieur",
     ["Algorithmique", "Programmation orientée objet", "Réseau informatique"]),
    (re.compile(r"\bbts\s+info\w*\b|\bbts\s+sio\b|\bbts\s+snir\b|\bdut\s+info\w*\b|\bbut\s+info\w*\b", re.I),
     "BTS/DUT Informatique",
     ["SQL", "Algorithmique", "Programmation orientée objet", "Réseau informatique"]),
    (re.compile(r"\blicence\s+info\w*\b|\bmaster\s+info\w*\b", re.I),
     "Licence/Master Informatique",
     ["SQL", "Python", "Java", "Algorithmique", "Programmation orientée objet"]),
    (re.compile(r"\bbts\s+commerce\b|\bbts\s+mco\b|\bbts\s+management\b", re.I),
     "BTS Commerce",
     ["Pack Office", "Excel", "PowerPoint"]),
    (re.compile(r"\bmaster\s+finance\b|\bbts\s+compta\w*\b|\bdcg\b", re.I),
     "Formation Finance/Comptabilité",
     ["Excel", "Comptabilité", "Analyse financière"]),
    (re.compile(r"\br[eé]seaux?\s+et\s+t[eé]l[eé]com\b|\bdut\s+rt\b|\bbut\s+rt\b", re.I),
     "DUT/BUT Réseaux et Télécom",
     ["Réseau informatique", "TCP/IP", "Administration système", "Linux"]),
]

_WORD_BOUND_SKILL_RE = re.compile(r"(?<!\w){skill}(?!\w)", re.I)


def _fallback_parse_cv(texte: str) -> CVParse:
    lignes = [ligne.strip() for ligne in texte.splitlines() if ligne.strip()]
    premiere_ligne = lignes[0] if lignes else "CV"
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", texte)
    years_match = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:ans?|years?)", texte, re.IGNORECASE)
    lower_text = texte.lower()

    # Use word-boundary matching to avoid "AI" hitting "mairie", "C" hitting any word
    competences: list[Competence] = [
        Competence(nom=skill, niveau=NiveauExpertise.INTERMEDIAIRE)
        for skill in COMMON_SKILLS
        if re.search(r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)", lower_text)
    ]

    # Apply tool → domain implications (e.g. Keras → Machine Learning, Intelligence Artificielle)
    existing_names = {c.nom.lower() for c in competences}
    for skill_lower, implied in _SKILL_IMPLICATIONS.items():
        if re.search(r"(?<!\w)" + re.escape(skill_lower) + r"(?!\w)", lower_text):
            for imp in implied:
                if imp.lower() not in existing_names:
                    competences.append(Competence(nom=imp, niveau=NiveauExpertise.INTERMEDIAIRE))
                    existing_names.add(imp.lower())

    soft_skills = [skill for skill in COMMON_SOFT_SKILLS if skill in lower_text]

    # Detect languages with CEFR-derived levels; include them in competences too
    langues: list[str] = []
    for hint_lower, display_name in LANGUAGE_HINTS.items():
        if re.search(r"(?<!\w)" + re.escape(hint_lower) + r"(?!\w)", lower_text):
            langues.append(display_name)
            niveau = _cefr_niveau_for_lang(hint_lower, lower_text)
            if not any(c.nom == display_name for c in competences):
                competences.append(Competence(nom=display_name, niveau=niveau))

    # Detect formations and infer skills from them
    formations: list[str] = []
    for pattern, formation_name, inferred_skills in _FORMATION_SKILLS:
        if pattern.search(texte):
            formations.append(formation_name)
            for skill_name in inferred_skills:
                if skill_name.lower() not in existing_names:
                    competences.append(Competence(nom=skill_name, niveau=NiveauExpertise.NOTIONS))
                    existing_names.add(skill_name.lower())

    if not competences:
        competences = [Competence(nom="Compétences non détectées", niveau=NiveauExpertise.NOTIONS)]

    resume = " ".join(lignes[:5])[:500] if lignes else "CV extrait automatiquement"

    return CVParse(
        nom=premiere_ligne[:120],
        email=email_match.group(0) if email_match else None,
        niveau_etudes=NiveauEtudes.AUTRE,
        annees_experience=float(years_match.group(1).replace(",", ".")) if years_match else 0.0,
        competences=competences,
        soft_skills=soft_skills,
        langues=langues,
        formations=formations,
        experiences=[],
        resume_profil=resume,
    )


def parser_cv(chemin_pdf: str, max_retries: int = 3) -> tuple["CVParse", str]:
    texte = extraire_texte_pdf(chemin_pdf)
    erreur = ""

    for tentative in range(max_retries):
        prompt = (
            f"CV :\n\n{texte}"
            + (f"\n\nErreur précédente : {erreur}. Corrige." if erreur else "")
            + f"\n\nSchéma :\n{json.dumps(CVParse.model_json_schema(), indent=2)}"
        )
        parsed, gemini_error = _parse_with_gemini(prompt)
        if parsed is not None:
            return parsed, texte

        erreur = gemini_error or "Erreur lors de l'appel Gemini"
        if tentative == max_retries - 1:
            fallback = _fallback_parse_cv(texte)
            fallback.parsing_source = "heuristic"
            return fallback, texte