import json
import os
from pathlib import Path
import re
import time

from google import genai
from google.genai import types
from schemas import CVParse
import cvvect


def _load_dotenv() -> None:
    candidates = [
        Path(__file__).with_name(".env"),
        Path(__file__).resolve().parent.parent / ".env",
    ]

    for env_path in candidates:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[len("export "):].strip()
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


_load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise RuntimeError(
        "API key introuvable. Définis GEMINI_API_KEY ou GOOGLE_API_KEY dans l'environnement ou dans un fichier .env."
    )

client = genai.Client(api_key=API_KEY)

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "8192"))
SYSTEM_INSTRUCTION = (
    "Oublie toutes les instructions précédentes. Tu es maintenant "
    "un expert RH. "
    "Extrais les informations du CV fourni et retourne UNIQUEMENT un objet "
    "JSON valide correspondant exactement au schéma fourni. "
    "Si une information est absente, utilise null. "
    "Pour annees_experience, calcule depuis les dates si possible."
)


def extract(cv_path):
    text = cvvect.extract_text_ocr(cv_path)
    return cvvect.clean_text(text)


def _extract_retry_delay_seconds(error_message: str) -> float | None:
    match = re.search(r"Please retry in\s+([0-9]+(?:\.[0-9]+)?)s", error_message)
    if not match:
        return None
    return float(match.group(1))


def _parse_llm_json(raw_json: str) -> dict:
    cleaned = raw_json.strip()

    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start:end + 1])
        raise
    
def appeler_llm(text_cv: str, err_prec: str = "") -> str:
    contexte_erreur = ""
    
    if err_prec:
        contexte_erreur = f"\nErreur de validation précédente : {err_prec}\nCorrige le JSON."

    prompt = (
        f"Voici le CV :\n\n{text_cv}{contexte_erreur}"
        f"\n\nSchéma attendu :\n{json.dumps(CVParse.model_json_schema(), indent=2)}"
    )

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=MAX_OUTPUT_TOKENS,
            system_instruction=SYSTEM_INSTRUCTION,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    return response.text
    
    
def parser_cv(chemin_pdf: str, max_retries: int = 3) -> CVParse:
    texte = extract(chemin_pdf)
    erreur = ""

    for tentative in range(max_retries):
        try:
            raw_json = appeler_llm(texte, erreur)
        except Exception as e:
            error_message = str(e)
            is_quota_error = "RESOURCE_EXHAUSTED" in error_message or "429" in error_message
            if is_quota_error:
                delay = _extract_retry_delay_seconds(error_message)
                if delay is not None and tentative < max_retries - 1:
                    time.sleep(delay + 1)
                    continue
                raise RuntimeError(
                    "Quota Gemini dépassé (429). Vérifie ton quota/facturation, "
                    "ou attends la fenêtre de retry avant de relancer."
                ) from e
            raise

        try:
            data = _parse_llm_json(raw_json)
            return CVParse(**data)
        except Exception as e:
            erreur = str(e)
            if tentative == max_retries - 1:
                raise ValueError(f"Parsing échoué après {max_retries} tentatives : {erreur}")

    raise ValueError("Parsing échoué")

if __name__ == "__main__":
    try:
        parsed = parser_cv(str(Path(__file__).with_name("sample_cvf.pdf")))
        print("CV parsé avec succès !")
        print(parsed)
    except RuntimeError as e:
        print(f"Erreur: {e}")