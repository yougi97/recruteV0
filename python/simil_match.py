import faiss
import numpy as np
from math import ceil, sqrt


def compute_similarity(cv_vector, job_vector):
    cv_array = np.asarray(cv_vector, dtype='float32').reshape(1, -1)
    job_array = np.asarray(job_vector, dtype='float32').reshape(1, -1)

    if cv_array.shape[1] != job_array.shape[1]:
        raise ValueError(
            f"Dimension mismatch: cv_vector has {cv_array.shape[1]} dims, "
            f"job_vector has {job_array.shape[1]} dims"
        )

    cv_norm = np.linalg.norm(cv_array)
    job_norm = np.linalg.norm(job_array)

    if cv_norm == 0 or job_norm == 0:
        raise ValueError("Cannot compute similarity with a zero-norm vector")

    similarity = float((np.dot(cv_array, job_array.T) / (cv_norm * job_norm))[0, 0])
    return similarity

#prends en argument un vecteur de CV et une liste de vecteurs de job,
# et retourne les indices des k jobs les plus similaires au CV

def simil_match(cv_vector, job_vectors, k=10):

    d = 384          # dimensions 
    n_clusters =  ceil(sqrt(len(job_vectors)))

    # Création de l'index IVF
    quantizer = faiss.IndexFlatIP(d)          # compare les centroïdes
    index = faiss.IndexIVFFlat(quantizer, d, n_clusters, faiss.METRIC_INNER_PRODUCT)

    job_vectors = np.array(job_vectors, dtype='float32')
    faiss.normalize_L2(job_vectors)
    index.train(job_vectors)   # étape spécifique à IVF, pas dans le kNN basique
    index.add(job_vectors)

    # Recherche
    index.nprobe = 8
    cv_vector = np.array(cv_vector, dtype='float32').reshape(1, -1)
    faiss.normalize_L2(cv_vector)

    scores, indices = index.search(cv_vector, k=k)
    return scores, indices


#prends en argument une liste de vecteurs de CV et un de vecteur de job,
# et retourne les indices des k CVs les plus similaires au job
def simil_match_findcv(cv_vector, job_vectors, k=10):

    d = 384          # dimensions 
    n_clusters =  ceil(sqrt(len(cv_vector)))

    # Création de l'index IVF
    quantizer = faiss.IndexFlatIP(d)          # compare les centroïdes
    index = faiss.IndexIVFFlat(quantizer, d, n_clusters, faiss.METRIC_INNER_PRODUCT)

    
    cv_vector = np.array(cv_vector, dtype='float32')
    faiss.normalize_L2(cv_vector)
    index.train(cv_vector)   # étape spécifique à IVF, pas dans le kNN basique
    index.add(cv_vector)

    # Recherche
    index.nprobe = 8
    job_vectors = np.array(job_vectors, dtype='float32').reshape(1, -1)
    faiss.normalize_L2(job_vectors)

    scores, indices = index.search(job_vectors, k=k)
    return scores, indices