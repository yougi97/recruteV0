from flask import Flask, request, jsonify
import tempfile, os

from parsing_agent import parser_cv
from job_enrichment_agent import enrichir_offre
from dispatcher import sauvegarder_cv, sauvegarder_offre
from matching_agent import matcher, _charger_cv, _charger_offre
from explanation_agent import expliquer
import spring_client as api

app = Flask(__name__)

@app.post("/parse-cv")
def parse_cv_endpoint():
    cv_id = request.form.get("cv_id", type=int) if request.form else None
    fichier = request.files.get("cv") if request.files else None

    if cv_id is None:
        return jsonify({"erreur": "cv_id manquant"}), 400

    if fichier is not None:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            fichier.save(tmp.name)
            chemin = tmp.name
    else:
        pdf_bytes, file_name, _ = api.get_cv_pdf(cv_id)
        suffix = ".pdf" if file_name.lower().endswith(".pdf") else ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp.flush()
            chemin = tmp.name

    try:
        cv = parser_cv(chemin)
        sauvegarder_cv(cv, cv_id)
        return jsonify(cv.model_dump()), 200
    except ValueError as e:
        return jsonify({"erreur": str(e)}), 422
    finally:
        os.unlink(chemin)

@app.post("/enrich-job")
def enrich_job_endpoint():
    body     = request.json
    offre_id = body["offre_id"]
    titre    = body["titre"]
    desc     = body["description"]

    offre = enrichir_offre(titre, desc)
    sauvegarder_offre(offre, offre_id)
    return jsonify(offre.model_dump()), 200

@app.post("/match")
def match_endpoint():
    body     = request.json
    cv_id    = body["cv_id"]
    offre_id = body["offre_id"]

    resultat = matcher(cv_id, offre_id)

    explication = None
    if resultat.detail_llm:
        cv    = _charger_cv(cv_id)
        offre = _charger_offre(offre_id)
        expl  = expliquer(resultat, cv, offre)
        explication = expl.model_dump()

    return jsonify({
        "score_final": resultat.score_final,
        "scores_detail": {
            "semantique": resultat.score_semantique,
            "structure":  resultat.score_structure,
            "llm":        resultat.score_llm,
        },
        "explication": explication,
    }), 200