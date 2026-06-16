import numpy as np
import spring_client as api
from faiss_store import decoder_vecteur

def score_semantique(cv_id: int, offre_id: int) -> float:
    cv_data    = api.get_cv(cv_id)
    offre_data = api.get_job_offer(offre_id)

    if not cv_data.get("embedding") or not offre_data.get("embedding"):
        return 0.0

    vec_c = decoder_vecteur(cv_data["embedding"])
    vec_o = decoder_vecteur(offre_data["embedding"])

    return float(np.dot(vec_c, vec_o))