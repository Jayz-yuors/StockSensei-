#!/usr/bin/env bash
# QuantSensei - start everything (macOS / Linux / Git Bash)
# Usage: ./run_all.sh            -> portal + StockSensei + QuantCopilot
#        ./run_all.sh --portal   -> just the portal
ROOT="$(cd "$(dirname "$0")" && pwd)"
trap 'kill $(jobs -p) 2>/dev/null' EXIT
(cd "$ROOT/portal" && python3 server.py) &
if [ "$1" != "--portal" ]; then
  (cd "$ROOT/stocksensei/Stocks_predictor" && streamlit run app.py --server.port 8501 --server.headless true) &
  (cd "$ROOT/quantcopilot/backend" && python3 -m uvicorn app.main:app --port 8000) &
  (cd "$ROOT/quantcopilot/frontend" && npm run dev) &
fi
echo "Open http://localhost:8080"; wait
