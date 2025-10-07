# PowerShell setup script for Ollama and LLM models

Write-Host "🚀 Setting up Dark Matter MCP with Ollama..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Create Docker network if it doesn't exist
Write-Host "📡 Creating Docker network..." -ForegroundColor Yellow
docker network create darkmatter 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Network created" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Network already exists" -ForegroundColor Blue
}

# Start Ollama service
Write-Host "🤖 Starting Ollama service..." -ForegroundColor Yellow
docker-compose -f docker-compose.ollama.yml up -d ollama

# Wait for Ollama to be ready
Write-Host "⏳ Waiting for Ollama to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if Ollama is responding
$maxAttempts = 12
$attempt = 0
do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Ollama is ready!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "⏳ Waiting for Ollama to start... (attempt $($attempt + 1)/$maxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        $attempt++
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ Ollama failed to start after $maxAttempts attempts" -ForegroundColor Red
    exit 1
}

# Pull recommended models
Write-Host "📥 Pulling recommended models..." -ForegroundColor Cyan

# Pull a small efficient model first (good for development)
Write-Host "Pulling Llama 2 7B (recommended for development)..." -ForegroundColor Blue
docker exec darkmatter-ollama ollama pull llama2

# Pull Code Llama for coding assistance
Write-Host "Pulling Code Llama (great for coding assistance)..." -ForegroundColor Blue
docker exec darkmatter-ollama ollama pull codellama

# Pull Mistral (good balance of performance and size)
Write-Host "Pulling Mistral 7B (good for general chat)..." -ForegroundColor Blue
docker exec darkmatter-ollama ollama pull mistral

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Available models:" -ForegroundColor Cyan
docker exec darkmatter-ollama ollama list
Write-Host ""
Write-Host "🌐 Ollama is running at: http://localhost:11434" -ForegroundColor Green
Write-Host "📊 You can now start the LLM service with: docker-compose -f docker-compose.ollama.yml up -d llm-service" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 To test the setup:" -ForegroundColor Cyan
Write-Host "Invoke-RestMethod -Uri 'http://localhost:11434/api/tags'" -ForegroundColor Gray