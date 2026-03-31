from sentence_transformers import SentenceTransformer
from schemas import CVParse
from schemas import OffreParsee
import faiss, numpy as np

embedder = SentenceTransformer("all-MiniLM-L6-v2")
DIM = 384  # dimension all-MiniLM-L6-v2

# Deux index distincts, même espace d'embedding
index_candidats = faiss.IndexFlatIP(DIM)  # Inner Product = cosine si vecteurs normalisés
index_offres    = faiss.IndexFlatIP(DIM)

def normaliser(vecteur: np.ndarray) -> np.ndarray:
    """Normalise L2 pour que le produit scalaire = cosine similarity."""
    norme = np.linalg.norm(vecteur, axis=1, keepdims=True)
    return vecteur / (norme + 1e-9)

def texte_candidat(cv: CVParse) -> str:
    comp = ", ".join(f"{c.nom} {c.niveau.value}" for c in cv.competences)
    exps = " ".join(e.description for e in cv.experiences)
    return f"{cv.resume_profil} Compétences : {comp}. {exps}"

def texte_offre(offre: OffreParsee) -> str:
    # On utilise la description enrichie par Gemini, pas le texte brut
    return offre.description_enrichie

def ajouter_candidat(cv: CVParse, candidat_id: int):
    vec = embedder.encode([texte_candidat(cv)], normalize_embeddings=False)
    vec = normaliser(np.array(vec, dtype="float32"))
    index_candidats.add_with_ids(vec, np.array([candidat_id]))

def ajouter_offre(offre: OffreParsee, offre_id: int):
    vec = embedder.encode([texte_offre(offre)], normalize_embeddings=False)
    vec = normaliser(np.array(vec, dtype="float32"))
    index_offres.add_with_ids(vec, np.array([offre_id]))

def score_semantique(candidat_id: int, offre_id: int) -> float:
    """Cosine similarity entre vecteur candidat et vecteur offre."""
    vec_c = index_candidats.reconstruct(candidat_id).reshape(1, -1)
    vec_o = index_offres.reconstruct(offre_id).reshape(1, -1)
    return float(np.dot(vec_c, vec_o.T)[0][0])  # entre -1 et 1, en pratique 0-1