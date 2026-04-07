# config.py
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY  = os.environ["GEMINI_API_KEY"]
SPRING_BASE_URL = os.environ.get("SPRING_BASE_URL", "http://localhost:8080")
SPRING_AI_SECRET = os.environ.get("SPRING_AI_SECRET", "secret-interne")