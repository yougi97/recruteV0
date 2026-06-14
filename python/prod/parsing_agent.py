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

NIVEAUX DE COMPÉTENCES — ne pas mettre "intermediaire" par défaut, calibrer strictement :
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
    "AI", "TensorFlow", "PyTorch", "Keras", "NumPy", "Pandas", "scikit-learn", "FAISS",
    "Kotlin", "Android", "Swift", "iOS", "C", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Jenkins", "GitLab CI", "OCaml", "Scala",
    "Redis", "Elasticsearch", "GraphQL", "gRPC", "Kafka",
]

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
        return "\n".join(p.extract_text() or "" for p in pdf.pages)


def _fallback_parse_cv(texte: str) -> CVParse:
    lignes = [ligne.strip() for ligne in texte.splitlines() if ligne.strip()]
    premiere_ligne = lignes[0] if lignes else "CV"
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", texte)
    years_match = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:ans?|years?)", texte, re.IGNORECASE)
    lower_text = texte.lower()

    competences: list[Competence] = [
        Competence(nom=skill, niveau=NiveauExpertise.INTERMEDIAIRE)
        for skill in COMMON_SKILLS
        if skill.lower() in lower_text
    ]

    soft_skills = [skill for skill in COMMON_SOFT_SKILLS if skill in lower_text]

    # Detect languages with CEFR-derived levels; include them in competences too
    langues: list[str] = []
    for hint_lower, display_name in LANGUAGE_HINTS.items():
        if hint_lower in lower_text:
            langues.append(display_name)
            niveau = _cefr_niveau_for_lang(hint_lower, lower_text)
            if not any(c.nom == display_name for c in competences):
                competences.append(Competence(nom=display_name, niveau=niveau))

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
        experiences=[],
        resume_profil=resume,
    )


def parser_cv(chemin_pdf: str, max_retries: int = 3) -> CVParse:
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
            return parsed

        erreur = gemini_error or "Erreur lors de l'appel Gemini"
        if tentative == max_retries - 1:
            fallback = _fallback_parse_cv(texte)
            fallback.parsing_source = "heuristic"
            return fallback