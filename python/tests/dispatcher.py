# dispatcher.py
from sentence_transformers import SentenceTransformer
from python.tests.schemas import CVParse, NiveauExpertise
from python.tests.aimatch import OffreParsee
import numpy as np, json

embedder = SentenceTransformer("all-MiniLM-L6-v2")

NIVEAU_SCORE = {
    "notions": 1, "intermediaire": 2, "avance": 3, "expert": 4
}

# Mapping entre tes enums MySQL et nos enums Pydantic
NIVEAU_ETUDES_MAP = {
    "bac": "bac", "bac+2": "bac+2", "bac+3": "bac+3",
    "bac+5": "bac+5", "doctorat": "doctorat", "autre": "autre"
}

def encoder_vecteur(texte: str) -> bytes:
    """Encode en float32 et sérialise en bytes pour MEDIUMBLOB."""
    vec = embedder.encode([texte], normalize_embeddings=True)
    return np.array(vec[0], dtype="float32").tobytes()

def decoder_vecteur(blob: bytes) -> np.ndarray:
    """Désérialise un MEDIUMBLOB en vecteur numpy."""
    return np.frombuffer(blob, dtype="float32")

def texte_candidat(cv: CVParse) -> str:
    comp = ", ".join(f"{c.nom} {c.niveau.value}" for c in cv.competences)
    exps = " ".join(e.description for e in cv.experiences)
    return f"{cv.resume_profil} Compétences : {comp}. {exps}"

def sauvegarder_cv(cv: CVParse, cv_id: int, db):
    """Met à jour la ligne cvs existante avec les données parsées."""

    # 1. Vecteur dans embedding (MEDIUMBLOB)
    vecteur_bytes = encoder_vecteur(texte_candidat(cv))

    db.execute("""
        UPDATE cvs SET
            raw_text          = :raw_text,
            embedding         = :embedding,
            parsed_json       = :parsed_json,
            annees_experience = :annees_exp,
            niveau_etudes     = :niveau
        WHERE id = :cv_id
    """, {
        "raw_text":    cv.resume_profil,
        "embedding":   vecteur_bytes,
        "parsed_json": json.dumps(cv.model_dump(), ensure_ascii=False),
        "annees_exp":  cv.annees_experience,
        "niveau":      cv.niveau_etudes.value,
        "cv_id":       cv_id
    })

    # 2. Catégories dans categories + cv_categories
    for comp in cv.competences:
        # Upsert dans categories
        db.execute("""
            INSERT INTO categories (name, type, source)
            VALUES (:nom, 'skill', 'ai_generated')
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
        """, {"nom": comp.nom})

        category_id = db.execute("SELECT LAST_INSERT_ID()").scalar()

        # Upsert dans cv_categories
        db.execute("""
            INSERT INTO cv_categories (cv_id, category_id, confidence, level)
            VALUES (:cv_id, :cat_id, :conf, :level)
            ON DUPLICATE KEY UPDATE level = :level, confidence = :conf
        """, {
            "cv_id":   cv_id,
            "cat_id":  category_id,
            "conf":    NIVEAU_SCORE.get(comp.niveau.value, 2) / 4.0,
            "level":   comp.niveau.value.replace("avance", "avancé")
                                        .replace("intermediaire", "intermédiaire"),
        })

    # 3. Soft skills dans categories (type soft_skill)
    for soft in cv.soft_skills:
        db.execute("""
            INSERT INTO categories (name, type, source)
            VALUES (:nom, 'soft_skill', 'ai_generated')
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
        """, {"nom": soft})

        category_id = db.execute("SELECT LAST_INSERT_ID()").scalar()

        db.execute("""
            INSERT INTO cv_categories (cv_id, category_id, confidence)
            VALUES (:cv_id, :cat_id, 0.9)
            ON DUPLICATE KEY UPDATE confidence = 0.9
        """, {"cv_id": cv_id, "cat_id": category_id})

def sauvegarder_offre(offre: OffreParsee, offre_id: int, db):
    """Met à jour la ligne job_offers existante."""
    vecteur_bytes = encoder_vecteur(offre.description_enrichie)

    db.execute("""
        UPDATE job_offers SET
            enriched_description  = :enriched,
            embedding             = :embedding,
            parsed_json           = :parsed_json,
            annees_experience_min = :annees,
            niveau_etudes_min     = :niveau
        WHERE id = :offre_id
    """, {
        "enriched":    offre.description_enrichie,
        "embedding":   vecteur_bytes,
        "parsed_json": json.dumps(offre.model_dump(), ensure_ascii=False),
        "annees":      offre.annees_experience_min,
        "niveau":      offre.niveau_etudes_min,
        "offre_id":    offre_id
    })

    for comp in offre.competences_requises:
        db.execute("""
            INSERT INTO categories (name, type, source)
            VALUES (:nom, 'skill', 'ai_generated')
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
        """, {"nom": comp.nom})

        category_id = db.execute("SELECT LAST_INSERT_ID()").scalar()

        db.execute("""
            INSERT INTO job_categories
                (job_offer_id, category_id, required_level, is_mandatory)
            VALUES (:job_id, :cat_id, :level, :mandatory)
            ON DUPLICATE KEY UPDATE
                required_level = :level, is_mandatory = :mandatory
        """, {
            "job_id":   offre_id,
            "cat_id":   category_id,
            "level":    comp.niveau_minimum.replace("avance", "avancé")
                                           .replace("intermediaire", "intermédiaire"),
            "mandatory": comp.obligatoire
        })