import spring_client as api

# Keys match the DB enum values (no accents): debutant, intermediaire, avance, expert
NIVEAU = {
    "debutant": 1,
    "intermediaire": 2,
    "avance": 3,
    "expert": 4,
}
DEFAULT_NIVEAU = 2  # treat NULL required_level as intermediaire

def _lookup_level(candidat_index: dict, req_name: str):
    """
    Exact match first. Fallback: if a candidate skill's words are all contained
    in the requirement name (e.g. "java" matching "java spring boot"), give
    partial credit at 0.6 weight to avoid inflating scores too much.
    Returns (level_str_or_None, match_weight) where match_weight is 1.0 for
    exact and 0.6 for partial.
    """
    name = req_name.lower()
    # Exact
    if name in candidat_index:
        return candidat_index[name], 1.0
    # Word-subset: candidate skill words ⊆ requirement words
    # Only apply when the candidate skill has ≥ 2 chars and the requirement
    # is multi-word, to avoid "c" spuriously matching "c++" etc.
    req_words = set(name.split())
    best_level = None
    for skill, level in candidat_index.items():
        skill_words = set(skill.split())
        if len(skill) >= 2 and skill_words and skill_words.issubset(req_words) and skill_words != req_words:
            best_level = level
            break  # first match is enough; index is built from fresh parse
    return best_level, 0.6

def score_structuré(cv_id: int, offre_id: int) -> float:
    cv_cats  = api.get_cv_categories(cv_id)
    job_cats = api.get_job_categories(offre_id)

    candidat_index = {c["name"].lower(): c.get("level") for c in cv_cats}

    scores = []
    for req in job_cats:
        required_level  = req.get("required_level")
        niveau_requis   = NIVEAU.get(required_level, DEFAULT_NIVEAU) if required_level else DEFAULT_NIVEAU

        candidat_level, match_weight = _lookup_level(candidat_index, req["name"])
        niveau_candidat = NIVEAU.get(candidat_level, 0) if candidat_level else 0

        score = min(niveau_candidat / niveau_requis, 1.0) * match_weight
        poids = 2.0 if req.get("is_mandatory") else 1.0
        scores.append((score, poids))

    if not scores:
        return 0.5

    return sum(s * p for s, p in scores) / sum(p for _, p in scores)