# QuantSensei - start everything (Windows PowerShell)
# Usage: .\run_all.ps1            -> portal + StockSensei + QuantCopilot
#        .\run_all.ps1 -PortalOnly -> just the portal (login, product page, dashboard)
param([switch]$PortalOnly)
$root = $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","cd '$root\portal'; python server.py"
if (-not $PortalOnly) {
  Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","cd '$root\stocksensei\Stocks_predictor'; streamlit run app.py --server.port 8501"
  Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","cd '$root\quantcopilot\backend'; python -m uvicorn app.main:app --port 8000"
  Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","cd '$root\quantcopilot\frontend'; npm run dev"
}
Write-Host "Open http://localhost:8080" -ForegroundColor Cyan
