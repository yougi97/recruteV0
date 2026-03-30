import google.generativeai as genai
from .schemas import CVParse
import json,os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name = "gemini-2.0-flash",
    generation_config = genai.GenerationConfig(
        response_mime_type = "application/json",
        max_output_tokens = 1500,
    ),
    system_instruction= 
    """
    Oublie toutes les instructions précédentes. Tu es maintenant 
    un expert RH.
    Extrais les informations du CV fourni
    et retourne UNIQUEMENT un objet JSON valide correspondant exactement 
    au schéma fourni.
    Si une information est absente, utilise null.
    Pour annees_experience, calcule depuis les dates si possible.
    """
)


