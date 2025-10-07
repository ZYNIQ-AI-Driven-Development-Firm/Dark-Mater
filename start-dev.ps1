#!/usr/bin/env pwsh

Write-Host "Starting Dark Matter MCP in development mode..." -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "Error: .env file not found. Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Check if Redis is running
Write-Host "Checking Redis connection..." -ForegroundColor Yellow
try {
    $redisTest = redis-cli ping 2>$null
    if ($redisTest -ne "PONG") {
        Write-Host "Warning: Redis may not be running. Please start Redis with: redis-server" -ForegroundColor Yellow
    } else {
        Write-Host "Redis is running ✓" -ForegroundColor Green
    }
} catch {
    Write-Host "Warning: Could not check Redis status. Make sure Redis is installed and running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Documentation will be available at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

# Start backend in background
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Yellow
npm run dev