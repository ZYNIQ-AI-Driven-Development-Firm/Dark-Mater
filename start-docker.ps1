#!/usr/bin/env pwsh

Write-Host "🚀 Starting Dark Matter MCP with Docker Compose..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
try {
    docker info *>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not installed or not accessible." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Build and start all services
Write-Host "🔨 Building and starting all services..." -ForegroundColor Yellow
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Successfully started Dark Matter MCP!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Service URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend:    http://localhost:3030" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
    Write-Host "   API Docs:    http://localhost:8000/docs" -ForegroundColor White
    Write-Host "   PostgreSQL:  localhost:5432" -ForegroundColor White
    Write-Host "   Redis:       localhost:6379" -ForegroundColor White
    Write-Host ""
    Write-Host "📜 View logs with: docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "🛑 Stop services with: docker-compose down" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "❌ Failed to start services. Check the logs above." -ForegroundColor Red
    Write-Host "🔍 Debug with: docker-compose logs" -ForegroundColor Yellow
    exit 1
}