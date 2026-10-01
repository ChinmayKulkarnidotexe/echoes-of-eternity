# Helper script to launch AURA development servers

param (
    [string]$Service = "all" # "frontend", "backend", or "all"
)

Write-Host "🏛️ Launching AURA Dev Environment..." -ForegroundColor Cyan

if ($Service -eq "backend" -or $Service -eq "all") {
    Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"
}

if ($Service -eq "frontend" -or $Service -eq "all") {
    Write-Host "Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
}

Write-Host "✅ Dev servers dispatched in background terminal windows." -ForegroundColor Cyan
Write-Host "Backend API docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend App:    http://localhost:5173" -ForegroundColor Yellow
