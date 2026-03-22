import pdfplumber
import pytesseract
import re
from sentence_transformers import SentenceTransformer

def extract_text_from_pdf(pdf_path):

    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join(page.extract_text() for page in pdf.pages)
        
        
    if not text.strip():  # Si le texte extrait est vide, essayons avec OCR
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                # Convertir la page en image
                image = page.to_image(resolution=300)
                # Utiliser pytesseract pour extraire le texte de l'image
                text += pytesseract.image_to_string(image.original)
    return text


def clean_text(text):
    # Supprimer les espaces en début et fin de ligne
    text = text.strip()
    
    # Remplacer les multiples espaces par un seul espace
    text = re.sub(r'\s+', ' ', text)
    
    # caractères parasites (enlever les caractères spéciaux sauf les lettres,
    # chiffres, espaces et quelques ponctuations courantes)
    text = re.sub(r'[^\w\s\-\.,@]', '', text) 
    
    return text

def embed_text(text, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
    model = SentenceTransformer(model_name)
    embedding = model.encode(text)
    return embedding


