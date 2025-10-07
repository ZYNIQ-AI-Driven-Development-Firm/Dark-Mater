#!/usr/bin/env pwsh

Write-Host "Setting up Dark Matter MCP..." -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "Copying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "Please edit .env file with your SMTP credentials before continuing!" -ForegroundColor Red
    Write-Host "Required settings:" -ForegroundColor Yellow
    Write-Host "  SMTP_USER=your-email@gmail.com" -ForegroundColor White
    Write-Host "  SMTP_PASS=your-gmail-app-password" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to continue after editing .env"
}

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "backend"
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Set-Location ".."

Write-Host ""
Write-Host "Setup complete! To run the application:" -ForegroundColor Green
Write-Host ""
Write-Host "Option 1 - Development Mode:" -ForegroundColor Yellow
Write-Host "1. Start Redis: redis-server" -ForegroundColor White
Write-Host "2. Start Backend: cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White
Write-Host "3. Start Frontend: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Option 2 - Docker Mode:" -ForegroundColor Yellow
Write-Host "docker-compose up -d" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"