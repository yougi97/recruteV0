from pathlib import Path
import argparse

import cvvect
import simil_match


def resolve_cv_path(cli_path: str | None) -> Path:
    script_dir = Path(__file__).resolve().parent
    if cli_path:
        candidate = Path(cli_path)
        if not candidate.is_absolute():
            candidate = Path.cwd() / candidate
        return candidate.resolve()
    return (script_dir / "sample_cvf.pdf").resolve()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Teste la pipeline CV -> embedding -> similarité")
    parser.add_argument(
        "--cv",
        dest="cv_path",
        default=None,
        help="Chemin vers le PDF du CV (optionnel). Par défaut: python/sample_cvf.pdf",
    )
    args = parser.parse_args()

    cv_path = resolve_cv_path(args.cv_path)
    if not cv_path.exists():
        raise FileNotFoundError(f"CV introuvable: {cv_path}")

    # Test de l'extraction de texte
    text = cvvect.extract_text_from_pdf(str(cv_path))
    print("Texte extrait du CV :")
    print(text)

    # Test du nettoyage de texte
    cleaned_text = cvvect.clean_text(text)
    print("\nTexte nettoyé :")
    print(cleaned_text)

    # Test de l'embedding de texte
    embedding = cvvect.embed_text(cleaned_text)
    print("\nEmbedding du texte :")
    print(embedding)

    # Test du traitement complet du CV
    cv_embedding = cvvect.process_cv(str(cv_path))
    print("\nEmbedding complet du CV :")
    print(cv_embedding)

    # Test du traitement complet du CV avec métadonnées
    cv_embedding_meta, metadata = cvvect.process_cv_with_metadata(str(cv_path))
    print("\nEmbedding complet du CV avec métadonnées :")
    print(cv_embedding_meta)
    print("Métadonnées :")
    print(metadata)
    
    job = "Développeur Python avec expérience en machine learning et traitement de données."
    job_embedding = cvvect.process_job_text(job)
    print("\nEmbedding du texte de la description de poste :")
    print(job_embedding)
    # Test de la similitude entre le CV et la description de poste
    similarity = simil_match.compute_similarity(cv_embedding, job_embedding)
    print("\nSimilitude entre le CV et la description de poste :")
    print(similarity)   