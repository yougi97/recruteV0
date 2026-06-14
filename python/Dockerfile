FROM python:3.11-slim

WORKDIR /app/python

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download embedding models so there is no cold-download delay on first startup.
# all-MiniLM-L6-v2: CV/job document embeddings (semantic scorer)
# paraphrase-multilingual-MiniLM-L12-v2: skill-name synonym matching (structural scorer)
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('all-MiniLM-L6-v2'); \
SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2'); \
print('Models downloaded.')"

COPY . .

CMD ["sleep", "infinity"]
