# llm_scorer.py
import google.generativeai as genai
from pydantic import BaseModel
from python.tests.schemas import CVParse
from job_enrichment_agent import OffreParsee
import json

class ScoreLLM(BaseModel):
    coherence_trajectoire: float  # 0-1 : progression logique de carrière
    potentiel_evolution: float    # 0-1 : capacité à progresser sur le poste
    fit_culture: float            # 0-1 : soft skills vs environnement offre
    score_global: float           # 0-1 : synthèse pondérée par le LLM
    points_forts: list[str]       # max 3
    points_vigilance: list[str]   # max 2

model_scorer = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        max_output_tokens=800,
    ),
    system_instruction="""Tu es un recruteur senior. Évalue la compatibilité
entre un candidat et une offre sur des dimensions qualitatives que les
algorithmes ne peuvent pas capter : cohérence de trajectoire, potentiel,
fit culturel. Sois objectif et strict. Retourne uniquement du JSON valide."""
)

def score_llm(cv: CVParse, offre: OffreParsee) -> ScoreLLM:
    prompt = f"""
Candidat :
- Profil : {cv.resume_profil}
- Expérience : {cv.annees_experience} ans
- Compétences : {[f"{c.nom} ({c.niveau.value})" for c in cv.competences]}
- Expériences : {[f"{e.titre} chez {e.entreprise}" for e in cv.experiences]}

Offre :
- Titre : {offre.titre_normalise}
- Secteur : {offre.secteur}
- Exigences : {offre.description_enrichie[:500]}

Schéma attendu :
{json.dumps(ScoreLLM.model_json_schema(), indent=2)}
"""
    response = model_scorer.generate_content(prompt)
    data = json.loads(response.text)
    return ScoreLLM(**data)