import spring_client as api

# Keys match the DB enum values (no accents): debutant, intermediaire, avance, expert
NIVEAU = {
    "debutant": 1,
    "intermediaire": 2,
    "avance": 3,
    "expert": 4,
}
DEFAULT_NIVEAU = 2  # treat NULL required_level as intermediaire

# Synonym groups: any term in a group can substitute for any other (FR/EN mixed CVs).
# This handles abbreviations (IA↔Intelligence artificielle), field↔framework
# (Machine Learning↔TensorFlow/Keras), and category↔tool (Admin système↔Linux).
SYNONYM_GROUPS: list[frozenset[str]] = [
    frozenset({
        "ia", "intelligence artificielle", "artificial intelligence", "ai",
        "ia générative", "ia generative", "intelligence artificielle générative",
    }),
    frozenset({
        "machine learning", "ml", "deep learning", "apprentissage automatique",
        "apprentissage profond", "tensorflow", "pytorch", "keras",
        "scikit-learn", "scikit learn", "faiss",
    }),
    frozenset({
        "linux", "unix", "administration système", "administration systeme",
        "administration linux", "administration serveur", "sysadmin",
    }),
    frozenset({
        "android", "développement android", "developpement android",
        "kotlin", "android studio",
    }),
]

_SYNONYM_MAP: dict[str, int] = {
    term: i
    for i, group in enumerate(SYNONYM_GROUPS)
    for term in group
}
SYNONYM_WEIGHT = 0.75


def _lookup_level(candidat_index: dict, req_name: str):
    """
    Returns (level_str_or_None, match_weight).
    Priority: exact (1.0) > word-subset (0.6) > synonym group (0.75).
    """
    name = req_name.lower()

    # 1. Exact match
    if name in candidat_index:
        return candidat_index[name], 1.0

    # 2. Word-subset: candidate skill words ⊆ requirement words
    req_words = set(name.split())
    for skill, level in candidat_index.items():
        skill_words = set(skill.split())
        if len(skill) >= 2 and skill_words and skill_words.issubset(req_words) and skill_words != req_words:
            return level, 0.6

    # 3. Synonym group: IA↔Intelligence artificielle, TensorFlow→Machine Learning, etc.
    req_group = _SYNONYM_MAP.get(name)
    if req_group is not None:
        for skill, level in candidat_index.items():
            if _SYNONYM_MAP.get(skill.lower()) == req_group:
                return level, SYNONYM_WEIGHT

    return None, 0.6

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