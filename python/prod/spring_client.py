import requests
from config import SPRING_BASE_URL, SPRING_API_KEY

HEADERS = {
    "X-AI-Secret": SPRING_API_KEY,
    "Content-Type": "application/json"
}

def _url(path: str) -> str:
    return f"{SPRING_BASE_URL}{path}"


# ── CV ────────────────────────────────────────────────────────────────────────

def get_cv(cv_id: int) -> dict:
    r = requests.get(_url(f"/api/internal/cvs/{cv_id}"), headers=HEADERS)
    r.raise_for_status()
    return r.json()

def update_cv_parsed(cv_id: int, payload: dict):
    """
    payload = {
        parsed_json, embedding (base64), annees_experience, niveau_etudes
    }
    """
    r = requests.put(
        _url(f"/api/internal/cvs/{cv_id}/parsed"),
        json=payload, headers=HEADERS
    )
    r.raise_for_status()

def upsert_cv_categories(cv_id: int, categories: list[dict]):
    """
    categories = [
        { name, type, level, confidence },
        ...
    ]
    """
    r = requests.post(
        _url(f"/api/internal/cvs/{cv_id}/categories"),
        json=categories, headers=HEADERS
    )
    r.raise_for_status()


# ── OFFRES ────────────────────────────────────────────────────────────────────

def get_job_offer(offre_id: int) -> dict:
    r = requests.get(_url(f"/api/internal/jobs/{offre_id}"), headers=HEADERS)
    r.raise_for_status()
    return r.json()

def update_job_parsed(offre_id: int, payload: dict):
    """
    payload = {
        parsed_json (OffreParsee.model_dump(), contient description_enrichie),
        embedding (base64),
        annees_experience_min,
        niveau_etudes_min
    }
    """
    r = requests.put(
        _url(f"/api/internal/jobs/{offre_id}/parsed"),
        json=payload, headers=HEADERS
    )
    r.raise_for_status()

def upsert_job_categories(offre_id: int, categories: list[dict]):
    r = requests.post(
        _url(f"/api/internal/jobs/{offre_id}/categories"),
        json=categories, headers=HEADERS
    )
    r.raise_for_status()


# ── SCORES ───────────────────────────────────────────────────────────────────

def get_cv_categories(cv_id: int) -> list[dict]:
    """Retourne [{ name, type, level, confidence }]"""
    r = requests.get(_url(f"/api/internal/cvs/{cv_id}/categories"), headers=HEADERS)
    r.raise_for_status()
    return r.json()

def get_job_categories(offre_id: int) -> list[dict]:
    """Retourne [{ name, type, required_level, is_mandatory }]"""
    r = requests.get(_url(f"/api/internal/jobs/{offre_id}/categories"), headers=HEADERS)
    r.raise_for_status()
    return r.json()

def save_matching_result(cv_id: int, offre_id: int, payload: dict):
    """
    payload = {
        ai_score (float, score pondéré final),
        score_semantique (float),
        score_structure (float),
        score_llm (float),
        rating (str or null, optionnel: 'up'/'down' si le candidat a voté)
    }
    Insère dans candidate_job_ratings avec les scores IA et le rating utilisateur si fourni.
    """
    r = requests.post(
        _url(f"/api/internal/match"),
        json={"cv_id": cv_id, "job_offer_id": offre_id, **payload},
        headers=HEADERS
    )
    r.raise_for_status()