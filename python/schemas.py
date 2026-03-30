# schemas.py
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class NiveauEtudes(str, Enum):
    BAC = "bac"
    BAC2 = "bac+2"
    BAC3 = "bac+3"
    BAC5 = "bac+5"
    DOCTORAT = "doctorat"
    AUTRE = "autre"

class NiveauExpertise(str, Enum):
    NOTIONS = "notions"       # on connait la théorié mais on a peu ou pas pratiqué
    INTERMEDIAIRE = "intermediaire"  # utilisé sur projets perso/académiques
    AVANCE = "avance"         # utilisé en pro, autonome
    EXPERT = "expert"         # maîtrise approfondie, peut former

class Competence(BaseModel):
    nom: str                         # "Python", "FAISS", "Spring Boot"...
    niveau: NiveauExpertise
    annees: Optional[float] = None   # années d'utilisation si déductible

class Experience(BaseModel):
    titre: str
    entreprise: str
    duree_mois: Optional[int] = None
    description: str

class CVParse(BaseModel):
    nom: str
    email: Optional[str] = None
    niveau_etudes: NiveauEtudes
    annees_experience: float = Field(ge=0)
    competences: list[Competence]    # structuré avec niveau
    soft_skills: list[str]
    langues: list[str]
    experiences: list[Experience]
    resume_profil: str