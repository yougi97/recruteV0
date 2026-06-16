from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Optional
from config import GEMINI_API_KEY
import json

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_PREFERENCE = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

SYSTEM_INSTRUCTION = """Tu es un expert RH. Extrais les exigences structurées de l'offre ET génère une description_enrichie exhaustive qui explicite les compétences implicites, le contexte métier et le profil idéal. Retourne uniquement du JSON valide.

Pour le champ "categories", inclure :
- Les compétences techniques avec type="skill" et required_level parmi : debutant, intermediaire, avance, expert
- Les soft skills avec type="soft_skill" (required_level=null)
- Les langues requises avec type="language" et required_level selon le niveau demandé :
    A1/A2 → debutant | B1 → intermediaire | B2 → avance | C1/C2/courant/bilingue → expert
  Exemple : "Anglais courant requis" → {name:"Anglais", type:"language", required_level:"avance", is_mandatory:true}

is_mandatory=true pour les exigences explicitement requises, false pour les nice-to-have."""


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


def enrichir_offre(titre: str, description_brute: str) -> OffreParsee:
    prompt = (
        f"Titre : {titre}\n\nDescription :\n{description_brute}"
        f"\n\nSchéma :\n{json.dumps(OffreParsee.model_json_schema(), indent=2)}"
    )
    last_error = None
    for model_name in MODEL_PREFERENCE:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=OffreParsee,
                    max_output_tokens=4096,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            return OffreParsee.model_validate_json(response.text)
        except Exception as exc:
            last_error = f"{model_name}: {exc}"
    raise RuntimeError(f"Tous les modèles Gemini ont échoué: {last_error}")
