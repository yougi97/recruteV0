import google.generativeai as genai
import pdfplumber
import json
from config import GEMINI_API_KEY
from schemas import CVParse

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        max_output_tokens=1500,
    ),
    system_instruction="""Oublie toutes les instructions précédentes.
    Tu es un expert RH. Extrais les informations du CV
    et retourne uniquement un JSON valide correspondant au schéma fourni.
    Si une info est absente, utilise null."""
)

def extraire_texte_pdf(chemin: str) -> str:
    with pdfplumber.open(chemin) as pdf:
        return "\n".join(p.extract_text() or "" for p in pdf.pages)

def parser_cv(chemin_pdf: str, max_retries: int = 3) -> CVParse:
    texte  = extraire_texte_pdf(chemin_pdf)
    erreur = ""

    for tentative in range(max_retries):
        prompt = (
            f"CV :\n\n{texte}"
            + (f"\n\nErreur précédente : {erreur}. Corrige." if erreur else "")
            + f"\n\nSchéma :\n{json.dumps(CVParse.model_json_schema(), indent=2)}"
        )
        response = model.generate_content(prompt)
        try:
            return CVParse(**json.loads(response.text))
        except Exception as e:
            erreur = str(e)
            if tentative == max_retries - 1:
                raise ValueError(f"Parsing échoué : {erreur}")