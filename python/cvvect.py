import pdfplumber
import pytesseract
import re

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
    
    # caractères parasites
    text = re.sub(r'[^\w\s\-\.,@]', '', text) 
    
    return text