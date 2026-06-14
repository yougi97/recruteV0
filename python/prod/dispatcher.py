import base64
from schemas import CVParse
from job_enrichment_agent import OffreParsee
from faiss_store import encoder_vecteur, texte_candidat, texte_offre
import spring_client as api

NIVEAU_SCORE = {"notions": 1, "intermediaire": 2, "avance": 3, "expert": 4}

def _niveau_mysql(niveau_str: str) -> str:
    """Convertit nos enums vers les enums MySQL français."""
    return (niveau_str
            .replace("notions", "debutant")
            .replace("avance", "avance")
            .replace("intermediaire", "intermediaire"))

def sauvegarder_cv(cv: CVParse, cv_id: int, raw_text: str | None = None):
    vecteur_b64 = base64.b64encode(encoder_vecteur(texte_candidat(cv))).decode()

    cv_data = api.get_cv(cv_id)
    candidate_profile = cv_data.get("candidateProfiles") or {}
    candidate_user = candidate_profile.get("user") or {}

    # 1. Met à jour cvs via Spring
    payload: dict = {
        "parsed_json":       cv.model_dump(),
        "embedding":         vecteur_b64,
        "annees_experience": cv.annees_experience,
        "niveau_etudes":     cv.niveau_etudes.value,
    }
    if raw_text:
        payload["raw_text"] = raw_text
    api.update_cv_parsed(cv_id, payload)

    # 2. Met à jour candidate_profiles avec les champs extraits du CV
    if candidate_profile.get("id"):
        api.update_candidate_profile(candidate_profile["id"], {
            "user": {
                "id": candidate_user.get("id"),
                "email": candidate_user.get("email"),
                "userType": candidate_user.get("userType") or candidate_user.get("user_type"),
                "firstName": candidate_user.get("firstName") or candidate_user.get("first_name"),
                "lastName": candidate_user.get("lastName") or candidate_user.get("last_name"),
            },
            "title": candidate_profile.get("title"),
            "location": candidate_profile.get("location"),
            "targetLocation": candidate_profile.get("targetLocation") or candidate_profile.get("target_location") or [],
            "bio": candidate_profile.get("bio"),
            "anneesExperience": cv.annees_experience,
            "niveauEtudes": cv.niveau_etudes.value,
        })

    # 3. Upsert catégories
    categories = []
    for comp in cv.competences:
        categories.append({
            "name":       comp.nom,
            "type":       "skill",
            "level":      _niveau_mysql(comp.niveau.value),
            "confidence": NIVEAU_SCORE[comp.niveau.value] / 4.0,
        })
    for soft in cv.soft_skills:
        categories.append({
            "name":       soft,
            "type":       "soft_skill",
            "level":      None,
            "confidence": 0.9,
        })
    # Languages — save any not already covered by competences (Gemini should put them there,
    # but this is a safety net for when it doesn't).
    competence_names = {comp.nom.lower() for comp in cv.competences}
    for lang in cv.langues:
        if lang.lower() not in competence_names:
            categories.append({
                "name":       lang,
                "type":       "skill",
                "level":      "intermediaire",
                "confidence": 0.7,
            })

    api.upsert_cv_categories(cv_id, categories)

def sauvegarder_offre(offre: OffreParsee, offre_id: int):
    vecteur_b64 = base64.b64encode(encoder_vecteur(texte_offre(offre))).decode()

    api.update_job_parsed(offre_id, {
        "parsed_json":            offre.model_dump(),
        "embedding":              vecteur_b64,
        "annees_experience_min":  offre.annees_experience_min,
        "niveau_etudes_min":      offre.niveau_etudes_min,
    })

    categories = []
    for comp in offre.categories:
        categories.append({
            "name":           comp.name,
            "type":           comp.type,
            "required_level": comp.required_level,
            "is_mandatory":   comp.is_mandatory,
        })

    api.upsert_job_categories(offre_id, categories)