#!/usr/bin/env bash
# Simple health/check script: curl endpoints and validate matchScore values
BASE=${BASE:-http://localhost:8080}
CANDIDATE_ID=${1:-2}

set -euo pipefail

echo "Using base: $BASE | candidate: $CANDIDATE_ID"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

PUBLIC_FILE="$TMPDIR/public.json"
SUGG_FILE="$TMPDIR/suggestions.json"

echo "Fetching /public/offers?candidateId=$CANDIDATE_ID"
curl -s "$BASE/public/offers?candidateId=$CANDIDATE_ID" -o "$PUBLIC_FILE"
echo "Response (public):"
cat "$PUBLIC_FILE" | python3 -m json.tool || true

echo
echo "Fetching /users/candidate/$CANDIDATE_ID/suggestions"
curl -s "$BASE/users/candidate/$CANDIDATE_ID/suggestions" -o "$SUGG_FILE"
echo "Response (suggestions):"
cat "$SUGG_FILE" | python3 -m json.tool || true

echo
echo "Validating matchScore values..."

python3 - <<PY
import json,sys

def check(path, name):
    s=open(path,'r',encoding='utf8').read()
    try:
        arr=json.loads(s)
    except Exception as e:
        print(f"{name}: invalid JSON: {e}")
        return 2
    scores=[None if x is None else int(round(x.get('matchScore',50))) for x in arr]
    print(f"{name} scores:", scores)
    if len(scores)>0 and all(sc==scores[0] for sc in scores):
        print(f"{name}: ALL SCORES IDENTICAL -> {scores[0]}")
        return 1
    print(f"{name}: OK (not all identical)")
    return 0

rc1=check('$PUBLIC_FILE','public')
rc2=check('$SUGG_FILE','suggestions')
rc = rc1 or rc2
sys.exit(rc)
PY

RC=$?
if [ $RC -eq 0 ]; then
  echo "SUCCESS: checks passed"
else
  echo "FAIL: one or more endpoints returned identical scores"
fi
exit $RC
