import base64, json
from schemas import CVParse
from job_enrichment_agent import OffreParsee
from faiss_store import encoder_vecteur, texte_candidat, texte_offre
import spring_client as api

NIVEAU_SCORE = {"notions": 1, "intermediaire": 2, "avance": 3, "expert": 4}

def _niveau_mysql(niveau_str: str) -> str:
    """Convertit nos enums vers les enums MySQL français."""
    return (niveau_str
            .replace("avance", "avancé")
            .replace("intermediaire", "intermédiaire"))

def sauvegarder_cv(cv: CVParse, cv_id: int):
    vecteur_b64 = base64.b64encode(encoder_vecteur(texte_candidat(cv))).decode()

    # 1. Met à jour cvs via Spring
    api.update_cv_parsed(cv_id, {
        "parsed_json":       cv.model_dump(),
        "embedding":         vecteur_b64,
        "annees_experience": cv.annees_experience,
        "niveau_etudes":     cv.niveau_etudes.value,
    })

    # 2. Met à jour candidate_profiles via Spring
    # (Spring déduit le candidate_id depuis cv_id)

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
    for comp in offre.competences_requises:
        categories.append({
            "name":           comp.nom,
            "type":           "skill",
            "required_level": _niveau_mysql(comp.niveau_minimum),
            "is_mandatory":   comp.obligatoire,
        })
    for soft in offre.soft_skills:
        categories.append({
            "name":           soft,
            "type":           "soft_skill",
            "required_level": None,
            "is_mandatory":   False,
        })

    api.upsert_job_categories(offre_id, categories)