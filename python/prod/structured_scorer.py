import spring_client as api
import numpy as np
from sentence_transformers import SentenceTransformer

# Keys match the DB enum values (no accents): debutant, intermediaire, avance, expert
NIVEAU = {
    "debutant": 1,
    "intermediaire": 2,
    "avance": 3,
    "expert": 4,
}
DEFAULT_NIVEAU = 2  # treat NULL required_level as intermediaire

# ── Tier 3a: multilingual embedding model ─────────────────────────────────────
# Catches direct synonyms and abbreviations (IA ↔ Intelligence artificielle,
# Deep Learning ↔ Machine Learning) without a hardcoded list.
# Separate from the CV/job document embedder in faiss_store.py.
_skill_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

# Threshold calibrated against real skill pairs (with context prefix):
#   "ia" ~ "intelligence artificielle"   = 0.759  ← want to match
#   "faiss" ~ "kotlin"                   = 0.736  ← must NOT match (false positive)
# 0.755 sits in the gap between them.
EMBED_THRESHOLD = 0.755
EMBED_WEIGHT    = 0.75

_vec_cache: dict[str, np.ndarray] = {}

def _skill_vec(name: str) -> np.ndarray:
    if name not in _vec_cache:
        _vec_cache[name] = _skill_model.encode(
            [f"compétence technique : {name}"],
            normalize_embeddings=True,
        )[0]
    return _vec_cache[name]


# ── Tier 3b: tool → field implications ────────────────────────────────────────
# Embeddings can't reliably infer "TensorFlow implies Machine Learning" because
# tool and field names sit in different parts of the embedding space.
# This dict maps a job requirement → set of CV skills that satisfy it.
# One-directional (requirement side only) and intentionally small.
IMPLICATIONS: dict[str, set[str]] = {
    "machine learning":          {"tensorflow", "pytorch", "keras", "scikit-learn", "scikit learn", "faiss", "xgboost", "lightgbm"},
    "deep learning":             {"tensorflow", "pytorch", "keras"},
    "intelligence artificielle": {"ia", "tensorflow", "keras", "pytorch", "faiss"},
    "ia":                        {"intelligence artificielle", "tensorflow", "keras", "pytorch", "faiss"},
    "administration système":    {"linux", "unix", "ubuntu", "debian", "centos", "rhel"},
    "administration linux":      {"linux", "unix", "ubuntu", "debian"},
    "développement android":     {"android", "kotlin"},
    "developpement android":     {"android", "kotlin"},
    "kotlin":                    {"android"},
    "développement ios":         {"swift", "objective-c", "xcode"},
    "développement mobile":      {"android", "kotlin", "swift", "react native", "flutter"},
    "data science":              {"python", "pandas", "numpy", "scikit-learn", "jupyter"},
    "base de données":           {"sql", "mysql", "postgresql", "mongodb", "oracle"},
    "devops":                    {"docker", "kubernetes", "jenkins", "gitlab ci", "terraform"},
}


def _lookup_level(candidat_index: dict, req_name: str):
    """
    Returns (level_str_or_None, match_weight).

    Priority:
      1. Exact match          → weight 1.0
      2. Word-subset          → weight 0.6   (e.g. "android" ⊆ "développement android")
      3. Embedding similarity → weight 0.75  (abbreviations, direct synonyms, sub-concepts)
      4. Implication lookup   → weight 0.70  (tool → field: TensorFlow → Machine Learning)
    """
    name = req_name.lower()

    # 1. Exact
    if name in candidat_index:
        return candidat_index[name], 1.0

    # 2. Word-subset: candidate words ⊆ requirement words
    req_words = set(name.split())
    for skill, level in candidat_index.items():
        skill_words = set(skill.split())
        if len(skill) >= 2 and skill_words and skill_words.issubset(req_words) and skill_words != req_words:
            return level, 0.6

    # 3. Embedding similarity (abbreviations, direct synonyms, field sub-concepts)
    req_vec = _skill_vec(name)
    best_level, best_sim = None, EMBED_THRESHOLD
    for skill, level in candidat_index.items():
        sim = float(np.dot(req_vec, _skill_vec(skill.lower())))
        if sim > best_sim:
            best_sim   = sim
            best_level = level
    if best_level is not None:
        return best_level, EMBED_WEIGHT

    # 4. Implication lookup: tool → field mappings embeddings can't infer
    implied = IMPLICATIONS.get(name, set())
    for skill, level in candidat_index.items():
        if skill.lower() in implied:
            return level, 0.70

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