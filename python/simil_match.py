import faiss
import numpy as np
from math import ceil, sqrt
import re


def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two vectors."""
    v1 = np.asarray(vec1, dtype='float32').reshape(1, -1)
    v2 = np.asarray(vec2, dtype='float32').reshape(1, -1)
    
    if v1.shape[1] != v2.shape[1]:
        raise ValueError(f"Dimension mismatch: {v1.shape[1]} vs {v2.shape[1]}")
    
    v1_norm = np.linalg.norm(v1)
    v2_norm = np.linalg.norm(v2)
    
    if v1_norm == 0 or v2_norm == 0:
        return 0.0
    
    return float((np.dot(v1, v2.T) / (v1_norm * v2_norm))[0, 0])


def extract_keywords(text):
    """Extract important keywords (words > 4 chars) from text."""
    # Remove special chars, lowercase
    text = re.sub(r'[^\w\s]', '', text.lower())
    words = text.split()
    
    # Keep meaningful words (> 4 chars, unless they're tech terms)
    tech_terms = {'c', 'c++', 'python', 'java', 'sql', 'r', 'ml', 'ai', 'nlp'}
    keywords = [w for w in words if len(w) > 3 or w in tech_terms]
    
    return set(keywords)


def compute_similarity(cv_vector, job_vector):
    """
    Compute similarity with cosine distance (simple version).
    Use compute_similarity_enhanced for better matching.
    """
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


def compute_similarity_enhanced(cv_text, job_text, cv_vector, job_vector, model=None):
    """
    Enhanced matching approach:
    - Embedding similarity is the main score (best for semantic matching)
    - Bonus increase if matching keywords found (indicates good domain fit)
    
    The embedding already captures semantic similarity, so we just add a small
    boost if we find domain-specific keyword matches.
    """
    # Main metric: embedding similarity
    embedding_sim = cosine_similarity(cv_vector, job_vector)
    
    # Keyword matching for domain verification
    cv_keywords = extract_keywords(cv_text)
    job_keywords = extract_keywords(job_text)
    
    matched_keywords = cv_keywords & job_keywords
    
    if cv_keywords and job_keywords:
        intersection = len(matched_keywords)
        union = len(cv_keywords | job_keywords)
        keyword_overlap = intersection / union if union > 0 else 0.0
    else:
        keyword_overlap = 0.0
    
    # Small bonus (max +10%) if we have strong keyword match
    # This helps distinguish between "semantically similar" vs "domain relevant"
    bonus = min(0.10, keyword_overlap * 0.15)
    combined_sim = min(1.0, embedding_sim + bonus)
    
    return {
        'combined': float(combined_sim),
        'embedding': float(embedding_sim),
        'keyword_bonus': float(bonus),
        'keyword_overlap': float(keyword_overlap),
        'cv_keywords_count': len(cv_keywords),
        'job_keywords_count': len(job_keywords),
        'matched_keywords': matched_keywords
    }

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