from dataclasses import dataclass
from schemas import CVParse
from job_enrichment_agent import OffreParsee
from semantic_scorer import score_semantique
from structured_scorer import score_structuré
from llm_scorer import score_llm, ScoreLLM
import spring_client as api
import json

POIDS = {"semantique": 0.25, "structure": 0.15, "llm": 0.60}

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
    # Spring serialises to camelCase; accept both forms
    parsed = data.get("parsedJson") or data.get("parsed_json") or {}
    if isinstance(parsed, str):
        parsed = json.loads(parsed) if parsed.strip() not in ("", "{}") else {}
    return CVParse(**parsed)

def _charger_offre(offre_id: int) -> OffreParsee:
    data = api.get_job_offer(offre_id)
    parsed = data.get("parsedJson") or data.get("parsed_json") or {}
    if isinstance(parsed, str):
        parsed = json.loads(parsed) if parsed.strip() not in ("", "{}") else {}
    return OffreParsee(**parsed)

def matcher(cv_id: int, offre_id: int) -> ResultatMatching:
    try:
        s_sem = score_semantique(cv_id, offre_id)
    except Exception:
        s_sem = 0.0

    try:
        s_str = score_structuré(cv_id, offre_id)
    except Exception:
        s_str = 0.5

    # Load CV/offer for LLM scoring and project-count boost
    cv_parsed    = None
    offre_parsed = None
    try:
        cv_parsed    = _charger_cv(cv_id)
        offre_parsed = _charger_offre(offre_id)
    except Exception:
        pass

    # LLM scoring — falls back to (sem+str)/2 if Gemini is unavailable
    detail_llm = None
    try:
        if cv_parsed and offre_parsed:
            detail_llm = score_llm(cv_parsed, offre_parsed)
            s_llm_val  = detail_llm.score_global
            if s_llm_val > 1.0:
                s_llm_val /= 100.0
            if detail_llm.score_global > 1.0:
                detail_llm.score_global /= 100.0
        else:
            s_llm_val = (s_sem + s_str) / 2
    except Exception:
        s_llm_val = (s_sem + s_str) / 2

    # Boost for personal projects — applied even when Gemini is rate-limited.
    # Gate: only boost when the CV is actually relevant to this offer
    # (structural shows some skill overlap OR semantic similarity is strong).
    if cv_parsed is not None and (s_str >= 0.1 or s_sem >= 0.50):
        PROJET_MARKERS = ("projet personnel", "personal project", "side project", "projet perso")
        nb_projets = sum(
            1 for e in cv_parsed.experiences
            if any(m in (e.description or "").lower() or m in (e.titre or "").lower()
                   for m in PROJET_MARKERS)
        )
        if nb_projets >= 5:
            s_llm_val = max(s_llm_val, 0.72)
        elif nb_projets >= 3:
            s_llm_val = max(s_llm_val, 0.65)
        if detail_llm:
            detail_llm.score_global = s_llm_val

    score_final = (
        POIDS["semantique"] * s_sem +
        POIDS["structure"]  * s_str +
        POIDS["llm"]        * s_llm_val
    )
    score_final = round(score_final, 3)

    # Sauvegarde via Spring
    api.save_matching_result(cv_id, offre_id, {
        "ai_score":         round(score_final * 100),
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