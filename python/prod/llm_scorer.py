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
- Un étudiant ou junior avec uniquement des cours/formations académiques sans projet personnel
  significatif ni expérience professionnelle doit recevoir un score bas (≤ 0.35) sur
  coherence_trajectoire et potentiel_evolution, même si les compétences listées correspondent.
- Des projets personnels sérieux, open-source, ou freelance comptent comme de l'expérience réelle
  et rehaussent le score.
- Plusieurs expériences professionnelles réussies dans le domaine → scores élevés (≥ 0.70).
- Beaucoup de projets complexes et variés compensent partiellement le manque d'années.
- Ne sois PAS généreux par défaut : un profil « correct sur le papier » sans preuves concrètes
  de réalisations obtient au maximum 0.55.

Tous les scores DOIVENT être des décimaux entre 0.0 et 1.0. JSON uniquement."""


class ScoreLLM(BaseModel):
    coherence_trajectoire: float
    potentiel_evolution:   float
    fit_culture:           float
    score_global:          float
    points_forts:          list[str]
    points_vigilance:      list[str]


def score_llm(cv: CVParse, offre: OffreParsee) -> ScoreLLM:
    experiences_detail = "\n".join(
        f"  • {e.titre} chez {e.entreprise}"
        + (f" ({e.duree_mois} mois)" if e.duree_mois else "")
        + (f" : {e.description[:120]}" if e.description else "")
        for e in cv.experiences
    ) if cv.experiences else "  Aucune expérience professionnelle ou projet renseigné"

    prompt = f"""
Candidat :
- Profil résumé : {cv.resume_profil}
- Niveau d'études : {cv.niveau_etudes.value}
- Années d'expérience déclarées : {cv.annees_experience}
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
