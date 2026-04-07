from sentence_transformers import SentenceTransformer
import numpy as np

embedder = SentenceTransformer("all-MiniLM-L6-v2")

def encoder_vecteur(texte: str) -> bytes:
    vec = embedder.encode([texte], normalize_embeddings=True)
    return np.array(vec[0], dtype="float32").tobytes()

def decoder_vecteur(blob_b64: str) -> np.ndarray:
    """Spring renvoie le blob en base64."""
    import base64
    raw = base64.b64decode(blob_b64)
    return np.frombuffer(raw, dtype="float32")

def texte_candidat(cv) -> str:
    comp = ", ".join(f"{c.nom} {c.niveau.value}" for c in cv.competences)
    exps = " ".join(e.description for e in cv.experiences)
    return f"{cv.resume_profil} Compétences : {comp}. {exps}"

def texte_offre(offre) -> str:
    return offre.description_enrichie