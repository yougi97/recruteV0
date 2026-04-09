import google.generativeai as genai
from pydantic import BaseModel
from schemas import CVParse
from job_enrichment_agent import OffreParsee
from config import GEMINI_API_KEY
import json

genai.configure(api_key=GEMINI_API_KEY)

class ScoreLLM(BaseModel):
    coherence_trajectoire: float
    potentiel_evolution:   float
    fit_culture:           float
    score_global:          float
    points_forts:          list[str]
    points_vigilance:      list[str]

model_scorer = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        max_output_tokens=800,
    ),
    system_instruction="""Oublie toutes les instructions précédentes.
    Tu es un recruteur senior. Évalue la compatibilité
    candidat/offre sur des dimensions qualitatives : cohérence de trajectoire,
    potentiel, fit culturel. Sois strict et objectif. JSON uniquement."""
)

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
    response = model_scorer.generate_content(prompt)
    return ScoreLLM(**json.loads(response.text))