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
    NOTIONS       = "notions"
    INTERMEDIAIRE = "intermediaire"
    AVANCE        = "avance"
    EXPERT        = "expert"

class Competence(BaseModel):
    nom:    str
    niveau: NiveauExpertise
    annees: Optional[float] = None

class Experience(BaseModel):
    titre:       str
    entreprise:  str
    duree_mois:  Optional[int] = None
    description: str

class CVParse(BaseModel):
    nom:                    str
    email:                  Optional[str] = None
    niveau_etudes:          NiveauEtudes
    annees_experience:      float = Field(ge=0)
    competences:            list[Competence]
    soft_skills:            list[str]
    langues:                list[str]
    experiences:            list[Experience]
    resume_profil:          str