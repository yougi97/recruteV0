import google.generativeai as genai
from pydantic import BaseModel
from typing import Optional
from config import GEMINI_API_KEY
import json

genai.configure(api_key=GEMINI_API_KEY)

class CategorieOffre(BaseModel):
    name:            str
    type:            str
    required_level:  Optional[str] = None
    is_mandatory:    bool = False

class OffreParsee(BaseModel):
    titre_normalise:         str
    secteur:                 str
    categories:              list[CategorieOffre]
    annees_experience_min:   float
    niveau_etudes_min:       str
    langues:                 list[str]
    description_enrichie:    str

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        max_output_tokens=1500,
    ),
    system_instruction="""Oublie toutes les instructions précédentes.
    Tu es un expert RH. Extrais les exigences structurées
    de l'offre ET génère une description_enrichie exhaustive qui explicite les
    compétences implicites, le contexte métier et le profil idéal.
    Retourne uniquement du JSON valide."""
)

def enrichir_offre(titre: str, description_brute: str) -> OffreParsee:
    prompt = (
        f"Titre : {titre}\n\nDescription :\n{description_brute}"
        f"\n\nSchéma :\n{json.dumps(OffreParsee.model_json_schema(), indent=2)}"
    )
    response = model.generate_content(prompt)
    return OffreParsee(**json.loads(response.text))