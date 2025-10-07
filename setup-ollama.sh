#!/bin/bash

# Setup script for Ollama and LLM models

echo "🚀 Setting up Dark Matter MCP with Ollama..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create Docker network if it doesn't exist
echo "📡 Creating Docker network..."
docker network create darkmatter 2>/dev/null || echo "Network already exists"

# Start Ollama service
echo "🤖 Starting Ollama service..."
docker-compose -f docker-compose.ollama.yml up -d ollama

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
sleep 10

# Check if Ollama is responding
until curl -s http://localhost:11434/api/tags > /dev/null; do
    echo "⏳ Waiting for Ollama to start..."
    sleep 5
done

echo "✅ Ollama is ready!"

# Pull recommended models
echo "📥 Pulling recommended models..."

# Pull a small efficient model first (good for development)
echo "Pulling Llama 2 7B (recommended for development)..."
docker exec darkmatter-ollama ollama pull llama2

# Pull Code Llama for coding assistance
echo "Pulling Code Llama (great for coding assistance)..."
docker exec darkmatter-ollama ollama pull codellama

# Pull Mistral (good balance of performance and size)
echo "Pulling Mistral 7B (good for general chat)..."
docker exec darkmatter-ollama ollama pull mistral

# Optional: Pull larger models (uncomment if you have enough resources)
# echo "Pulling Llama 2 13B (better quality, requires more resources)..."
# docker exec darkmatter-ollama ollama pull llama2:13b

echo "🎉 Setup complete!"
echo ""
echo "Available models:"
docker exec darkmatter-ollama ollama list
echo ""
echo "🌐 Ollama is running at: http://localhost:11434"
echo "📊 You can now start the LLM service with: docker-compose -f docker-compose.ollama.yml up -d llm-service"
echo ""
echo "🔧 To test the setup:"
echo "curl http://localhost:11434/api/tags"