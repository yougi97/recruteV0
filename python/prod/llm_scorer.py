from google import genai
from google.genai import types
from pydantic import BaseModel
from schemas import CVParse
from job_enrichment_agent import OffreParsee
from config import GEMINI_API_KEY
import json

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_PREFERENCE = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

SYSTEM_INSTRUCTION = """Tu es un recruteur senior exigeant.
Évalue la compatibilité candidat/offre de façon STRICTE et DIFFÉRENCIÉE.

Règles impératives sur le niveau d'expérience :
- Un étudiant ou junior sans AUCUN projet personnel ni expérience concrète (seulement des cours
  théoriques) → score bas (≤ 0.35) sur coherence_trajectoire et potentiel_evolution.
- Un projet personnel technique concret (pas juste un cours) compte autant qu'un mois
  d'expérience professionnelle. 3 projets sérieux ≈ junior avec 3 mois d'expérience.
- Un candidat avec 3 projets personnels ou plus DIRECTEMENT liés aux compétences clés de l'offre
  → traite-le comme un junior solide : score_global ≥ 0.65 si les projets couvrent les
  technologies demandées, même sans année de salariat.
- Un candidat avec 5 projets ou plus variés et pertinents → traite-le comme quelqu'un avec
  1 an d'expérience professionnelle : score_global peut atteindre 0.75.
- Plusieurs expériences professionnelles réussies dans le domaine → scores élevés (≥ 0.80).
- Ne sois PAS généreux par défaut : un profil sans aucune réalisation concrète (cours, certifs,
  aucun projet) obtient au maximum 0.40.
- Regarde les TITRES et DESCRIPTIONS des expériences/projets : des projets avec des technos
  spécifiques nommées (ex. FAISS, Kotlin, TensorFlow) prouvent une maîtrise réelle, pas
  théorique. Ces profils doivent être valorisés et mis en avant.

Tous les scores DOIVENT être des décimaux entre 0.0 et 1.0. JSON uniquement."""


class ScoreLLM(BaseModel):
    coherence_trajectoire: float
    potentiel_evolution:   float
    fit_culture:           float
    score_global:          float
    points_forts:          list[str]
    points_vigilance:      list[str]


def score_llm(cv: CVParse, offre: OffreParsee) -> ScoreLLM:
    PROJET_MARKERS = ("projet personnel", "personal project", "side project", "projet perso")
    projets_perso = [
        e for e in cv.experiences
        if any(m in (e.description or "").lower() or m in (e.titre or "").lower()
               for m in PROJET_MARKERS)
    ]
    nb_projets = len(projets_perso)

    experiences_detail = "\n".join(
        f"  • {e.titre} chez {e.entreprise}"
        + (f" ({e.duree_mois} mois)" if e.duree_mois else "")
        + (f" : {e.description[:120]}" if e.description else "")
        for e in cv.experiences
    ) if cv.experiences else "  Aucune expérience professionnelle ou projet renseigné"

    projet_note = ""
    if nb_projets >= 3:
        projet_note = (
            f"\n⚠️  NOTE IMPORTANTE : Ce candidat a {nb_projets} projets personnels concrets "
            f"identifiés ci-dessous. Chaque projet personnel technique avec des technos nommées "
            f"compte comme de l'expérience réelle. Avec {nb_projets} projets, pénaliser le "
            f"manque d'années de salariat serait une erreur d'évaluation : applique les règles "
            f"du barème pour les profils avec de nombreux projets (score_global ≥ 0.65).\n"
        )

    prompt = f"""
Candidat :
- Profil résumé : {cv.resume_profil}
- Niveau d'études : {cv.niveau_etudes.value}
- Années d'expérience déclarées : {cv.annees_experience}
- Projets personnels concrets identifiés : {nb_projets}{projet_note}
- Compétences : {", ".join(f"{c.nom} ({c.niveau.value})" for c in cv.competences)}
- Soft skills : {", ".join(cv.soft_skills) or "—"}
- Expériences / projets (les descriptions révèlent si c'est pro, académique ou personnel) :
{experiences_detail}

Offre : {offre.titre_normalise} ({offre.secteur})
- Exigences : {offre.description_enrichie[:400]}

Schéma JSON attendu : {json.dumps(ScoreLLM.model_json_schema(), indent=2)}
"""
    last_error = None
    for model_name in MODEL_PREFERENCE:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=ScoreLLM,
                    max_output_tokens=2048,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            result = ScoreLLM.model_validate_json(response.text)
            if result.score_global > 1.0:
                result.score_global /= 100.0
            return result
        except Exception as exc:
            last_error = f"{model_name}: {exc}"
    raise RuntimeError(f"Tous les modèles Gemini ont échoué: {last_error}")
