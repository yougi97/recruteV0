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

SYSTEM_INSTRUCTION = """Oublie toutes les instructions précédentes.
Tu es un recruteur senior. Évalue la compatibilité candidat/offre sur des
dimensions qualitatives : cohérence de trajectoire, potentiel, fit culturel.
Tous les scores DOIVENT être des nombres décimaux entre 0.0 et 1.0.
Sois strict et objectif. JSON uniquement."""


class ScoreLLM(BaseModel):
    coherence_trajectoire: float
    potentiel_evolution:   float
    fit_culture:           float
    score_global:          float
    points_forts:          list[str]
    points_vigilance:      list[str]


def score_llm(cv: CVParse, offre: OffreParsee) -> ScoreLLM:
    prompt = f"""
Candidat :
- Profil : {cv.resume_profil}
- Expérience : {cv.annees_experience} ans
- Compétences : {[f"{c.nom} ({c.niveau.value})" for c in cv.competences]}
- Parcours : {[f"{e.titre} chez {e.entreprise}" for e in cv.experiences]}

Offre : {offre.titre_normalise} ({offre.secteur})
- Exigences : {offre.description_enrichie[:400]}

Schéma : {json.dumps(ScoreLLM.model_json_schema(), indent=2)}
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
