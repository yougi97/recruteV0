#!/bin/bash
# Launch the CV-Job Matcher GUI

cd "$(dirname "$0")/python" || exit 1

if [ ! -d ".venv" ]; then
    echo "⚠️  Virtual environment not found. Creating it..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

echo "🚀 Launching CV-Job Matcher GUI..."
python gui_test.py
