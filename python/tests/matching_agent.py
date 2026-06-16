# matching_agent.py
from dataclasses import dataclass
from python.tests.schemas import CVParse
from python.tests.aimatch import OffreParsee
from python.tests.faiss_store import score_semantique
from structured_scorer import score_structuré
from python.tests.llm_scorer import score_llm, ScoreLLM

POIDS = {
    "semantique": 0.40,
    "structure":  0.35,
    "llm":        0.25,
}

@dataclass
class ResultatMatching:
    candidat_id: int
    offre_id: int
    score_final: float
    score_semantique: float
    score_structure: float
    score_llm: float
    detail_llm: ScoreLLM

def matcher(
    candidat_id: int,
    cv: CVParse,
    offre_id: int,
    offre: OffreParsee,
    db
) -> ResultatMatching:

    s_sem = score_semantique(candidat_id, offre_id)
    s_str = score_structuré(candidat_id, offre, db)
    s_llm = score_llm(cv, offre)

    score_final = (
        POIDS["semantique"] * s_sem +
        POIDS["structure"]  * s_str +
        POIDS["llm"]        * s_llm.score_global
    )

    return ResultatMatching(
        candidat_id=candidat_id,
        offre_id=offre_id,
        score_final=round(score_final, 3),
        score_semantique=round(s_sem, 3),
        score_structure=round(s_str, 3),
        score_llm=round(s_llm.score_global, 3),
        detail_llm=s_llm
    )