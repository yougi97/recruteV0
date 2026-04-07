import spring_client as api

NIVEAU = {
    None: 0,
    "débutant": 1, "intermédiaire": 2, "avancé": 3, "expert": 4
}

def score_structuré(cv_id: int, offre_id: int) -> float:
    cv_cats   = api.get_cv_categories(cv_id)
    job_cats  = api.get_job_categories(offre_id)

    # Index des compétences du candidat : name -> level
    candidat_index = {
        c["name"].lower(): c.get("level") for c in cv_cats
    }

    scores = []
    for req in job_cats:
        niveau_requis   = NIVEAU.get(req.get("required_level"), 2)
        niveau_candidat = NIVEAU.get(candidat_index.get(req["name"].lower()), 0)

        score = min(niveau_candidat / niveau_requis, 1.0) if niveau_requis else 1.0
        poids = 2.0 if req.get("is_mandatory") else 1.0
        scores.append((score, poids))

    if not scores:
        return 0.5

    return sum(s * p for s, p in scores) / sum(p for _, p in scores)