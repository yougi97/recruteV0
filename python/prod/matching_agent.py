from dataclasses import dataclass
from schemas import CVParse
from job_enrichment_agent import OffreParsee
from semantic_scorer import score_semantique
from structured_scorer import score_structuré
from llm_scorer import score_llm, ScoreLLM
import spring_client as api
import json

POIDS = {"semantique": 0.40, "structure": 0.35, "llm": 0.25}

@dataclass
class ResultatMatching:
    cv_id:            int
    offre_id:         int
    score_final:      float
    score_semantique: float
    score_structure:  float
    score_llm:        float
    detail_llm:       ScoreLLM | None

def _charger_cv(cv_id: int) -> CVParse:
    data = api.get_cv(cv_id)
    return CVParse(**data["parsed_json"])

def _charger_offre(offre_id: int) -> OffreParsee:
    data = api.get_job_offer(offre_id)
    return OffreParsee(**data["parsed_json"])

def matcher(cv_id: int, offre_id: int) -> ResultatMatching:
    s_sem = score_semantique(cv_id, offre_id)
    s_str = score_structuré(cv_id, offre_id)

    if s_sem + s_str < 0.6:
        s_llm_val  = (s_sem + s_str) / 2
        detail_llm = None
    else:
        cv         = _charger_cv(cv_id)
        offre      = _charger_offre(offre_id)
        detail_llm = score_llm(cv, offre)
        s_llm_val  = detail_llm.score_global

    score_final = (
        POIDS["semantique"] * s_sem +
        POIDS["structure"]  * s_str +
        POIDS["llm"]        * s_llm_val
    )
    score_final = round(score_final, 3)

    # Sauvegarde via Spring
    api.save_matching_result(cv_id, offre_id, {
        "ai_score":         score_final,
        "score_semantique": round(s_sem, 3),
        "score_structure":  round(s_str, 3),
        "score_llm":        round(s_llm_val, 3),
    })

    return ResultatMatching(
        cv_id=cv_id, offre_id=offre_id,
        score_final=score_final,
        score_semantique=round(s_sem, 3),
        score_structure=round(s_str, 3),
        score_llm=round(s_llm_val, 3),
        detail_llm=detail_llm,
    )