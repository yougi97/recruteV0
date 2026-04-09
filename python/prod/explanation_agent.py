import google.generativeai as genai
from pydantic import BaseModel
from matching_agent import ResultatMatching
from schemas import CVParse
from job_enrichment_agent import OffreParsee
from config import GEMINI_API_KEY
import json

genai.configure(api_key=GEMINI_API_KEY)

class ExplicationMatching(BaseModel):
    synthese:              str
    pourquoi_ca_matche:    str
    points_attention:      str
    recommandation:        str
    questions_entretien:   list[str]

model_explication = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        max_output_tokens=1000,
    ),
    system_instruction="""Tu es un recruteur senior. Explique en langage naturel
pourquoi ce candidat matche ou non ce poste. Ton direct et professionnel.
Ne répète pas les scores bruts, traduis-les. JSON uniquement."""
)

def expliquer(resultat: ResultatMatching, cv: CVParse, offre: OffreParsee) -> ExplicationMatching:
    detail = resultat.detail_llm
    prompt = f"""
Score final : {resultat.score_final}/1.0
- Sémantique : {resultat.score_semantique}
- Structuré  : {resultat.score_structure}
- LLM        : {resultat.score_llm}
{f"Points forts : {detail.points_forts}" if detail else ""}
{f"Vigilance : {detail.points_vigilance}" if detail else ""}

Candidat : {cv.nom}, {cv.annees_experience} ans d'XP
Compétences : {[f"{c.nom} ({c.niveau.value})" for c in cv.competences]}

Poste : {offre.titre_normalise} ({offre.secteur})
Exigences : {[f"{c.name} {c.required_level}{'*' if c.is_mandatory else ''}" for c in offre.categories]}

Schéma : {json.dumps(ExplicationMatching.model_json_schema(), indent=2)}
"""
    response = model_explication.generate_content(prompt)
    return ExplicationMatching(**json.loads(response.text))