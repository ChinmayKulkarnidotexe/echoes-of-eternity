# Helper script to launch the Echoes of Eternity development servers

param (
    [string]$Service = "all" # "frontend", "backend", or "all"
)

Write-Host "Launching Echoes of Eternity dev environment..." -ForegroundColor Cyan

# Stale uvicorn workers survive a closed terminal on Windows and keep port 8000,
# which looks exactly like the backend serving outdated data. Clear them first.
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*uvicorn*app.main:app*' } |
    ForEach-Object {
        Write-Host "  Stopping stale backend process $($_.ProcessId)" -ForegroundColor DarkYellow
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

if ($Service -eq "backend" -or $Service -eq "all") {
    Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"
}

if ($Service -eq "frontend" -or $Service -eq "all") {
    Write-Host "Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
}

Write-Host "Dev servers dispatched in background terminal windows." -ForegroundColor Cyan
Write-Host "Backend API docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend App:     http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "After editing backend/app/tour_data.py, drop the cached bundle:" -ForegroundColor DarkGray
Write-Host "  curl -X POST http://localhost:8000/experience/1/refresh" -ForegroundColor DarkGray
