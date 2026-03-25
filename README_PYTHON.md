# CV-Job Matcher 🎯

A Python tool to compute semantic similarity between CVs and job descriptions using embeddings and machine learning.

## Features

✅ Extract text from PDF CVs (OCR support)  
✅ Clean and vectorize text using sentence transformers  
✅ Compute cosine similarity between CV and job descriptions  
✅ FAISS-based job matching (find best matching jobs)  
✅ Graphical interface (tkinter) for easy testing  

---

## Quick Start

### 1️⃣ Setup (Python 3.10+)

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2️⃣ Launch GUI (Recommended)

```bash
# From repository root:
bash launch_gui.sh

# Or directly:
cd python
source .venv/bin/activate
python gui_test.py
```

### 3️⃣ CLI Testing

```bash
cd python
source .venv/bin/activate
python test.py
```

---

## How to Use the GUI

1. **Select a CV**
   - Click "Browse PDF..." to select a PDF file
   - Click "Process CV" to extract and vectorize the content

2. **Add Job Description**
   - **Option A**: Write directly in the text area
   - **Option B**: Load from file (select "Load from File" radio button, then click "Load Job File...")

3. **Compute Similarity**
   - Click "Compute Similarity" to get the match score
   - Score ranges from 0 (no match) to 1 (perfect match)

---

## Project Structure

```
python/
├── cvvect.py              # Text extraction, cleaning, embedding
├── simil_match.py         # Similarity computation & FAISS matching
├── test.py                # CLI test script
├── gui_test.py            # Tkinter GUI application
├── sample_cvf.pdf         # Example CV (Antonin Rossin's CV)
├── sample_jobs.txt        # Example job descriptions
└── requirements.txt       # Python dependencies
```

---

## Module Documentation

### `cvvect.py`

| Function | Description |
|----------|-------------|
| `extract_text_from_pdf(pdf_path)` | Extract text from PDF (with OCR fallback) |
| `clean_text(text)` | Remove special chars, normalize whitespace |
| `embed_text(text, model)` | Vectorize text using sentence-transformers |
| `process_cv(pdf_path)` | Full pipeline: extract → clean → embed |
| `process_cv_with_metadata(pdf_path)` | Same + return metadata |
| `process_job_text(job_text)` | Process job description text |

**Model used**: `paraphrase-multilingual-MiniLM-L12-v2` (384-dim embeddings)

### `simil_match.py`

| Function | Description |
|----------|-------------|
| `compute_similarity(cv_vec, job_vec)` | Cosine similarity (0-1) |
| `simil_match(cv_vec, job_vecs, k=10)` | FAISS IVF: find k best matching jobs |
| `simil_match_findcv(cv_vecs, job_vec, k=10)` | Reverse: find k best CVs for a job |

---

## Dependencies

**Core**:
- `numpy` — numerical computing
- `pdfplumber` — PDF text extraction
- `pytesseract` — OCR (requires Tesseract binary)
- `sentence-transformers` — semantic embeddings
- `faiss-cpu` — fast similarity search

**Built-in**:
- `tkinter` — GUI (pre-installed with Python)
- `regex` — enhanced regex support

---

## Troubleshooting

### ❌ "No module named pdfplumber"
Ensure virtual environment is activated:
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### ❌ "bus error" (macOS/Apple Silicon)
Older versions of FAISS/NumPy on ARM64. The `.venv` is already configured correctly.

### ❌ OCR not working (pytesseract)
Install Tesseract binary (macOS):
```bash
brew install tesseract
```

### ❌ GUI won't display
- Ensure X11 is available (Linux)
- Or use SSH with X forwarding
- Or modify to run in headless mode

---

## Example Usage (CLI)

```python
import cvvect
import simil_match

# Process CV
cv_embedding = cvvect.process_cv('my_cv.pdf')

# Process job
job_text = "Seeking Python developer with 3+ years experience..."
job_embedding = cvvect.process_job_text(job_text)

# Compute match score
similarity = simil_match.compute_similarity(cv_embedding, job_embedding)
print(f"Match score: {similarity:.2%}")
```

---

## Performance Notes

- **First run**: ~10-15s (downloads ML model ~470MB from HuggingFace)
- **Subsequent runs**: ~2-3s (model cached locally)
- **FAISS indexing**: Efficient for 10k+ job vectors

---

## License & Author

Project: `recruteV0`  
Branch: `python-ai`
