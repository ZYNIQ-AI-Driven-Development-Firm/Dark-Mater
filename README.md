# Dark Matter MCP (Model Context Protocol)

A sophisticated full-stack application for managing MCP (Model Context Protocol) server instances with advanced OTP authentication, real-time communication, server lifecycle management, and integrated Ollama AI chat capabilities.

## 🚀 Features

- **Secure Authentication**: Email-based OTP authentication system with JWT tokens
- **Server Management**: Full lifecycle management for MCP server instances
- **Ollama AI Integration**: Production-ready local LLM integration with streaming support
- **Dual Chat Modes**: Company Chat (shared knowledge with RAG) and MCP Chat (per-server conversations)
- **Vector Database**: pgvector integration for semantic search and RAG capabilities
- **Real-time Communication**: WebSocket integration for live updates
- **Modern UI**: React with TypeScript, Tailwind CSS, and streaming chat interfaces
- **Production Ready**: Docker containerization and cloud deployment configuration

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Axios** for HTTP requests
- **WebSocket** for real-time communication

### Backend
- **FastAPI** with async support
- **SQLModel** for database ORM with pgvector
- **PostgreSQL** with vector similarity search
- **Redis** for caching and sessions
- **Ollama** for local LLM inference
- **JWT** authentication
- **SMTP Email** system with OTP
- **WebSocket** support

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.12+
- PostgreSQL 15+ with pgvector extension
- Redis server
- Ollama (for local LLM inference)
- Docker and Docker Compose (recommended)
- Email account with SMTP access (Gmail recommended)

## 🚀 Quick Start

### 1. Clone and Configure

```bash
git clone <repository-url>
cd Dark-Matter-MPC

# Copy environment template and configure
cp .env.example .env
```

### 2. Configure Environment (Required)

Edit `.env` file with your settings:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/darkmatter_mcp

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_USER_SEND_FROM=your-email@gmail.com

# JWT Configuration (generate secure keys)
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

**For Gmail Setup:**
1. Enable 2-factor authentication on your Google account
2. Go to Google Account Settings → Security → App passwords
3. Generate a new app password for "Mail"
4. Use this app password (not your regular password) in `SMTP_PASS`

### 3. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Initialize Database

```bash
# Run database migrations (PostgreSQL + pgvector)
cd backend
alembic upgrade head
cd ..
```

### 5. Setup Ollama (Required for AI Features)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# Install required models (in another terminal)
ollama pull llama3.2:3b        # For general chat
ollama pull nomic-embed-text   # For embeddings/RAG
```

### 6. Run the Application

#### Option A: Docker Mode (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Ollama, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Load sample company documents (optional)
docker-compose exec backend python scripts/load_company_docs.py

# Stop services
docker-compose down
```

#### Option B: Development Mode

```bash
# Terminal 1: Start PostgreSQL + Redis + Ollama (Docker)
docker-compose up postgres redis ollama -d

# Terminal 2: Start Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start Frontend
npm run dev

# Terminal 4: Load sample company documents (optional)
cd backend
python scripts/load_company_docs.py
```

## � Security Features

- **Email OTP Authentication**: 6-digit codes with TTL and rate limiting
- **JWT Tokens**: Access (15min) and refresh (7 days) tokens
- **Rate Limiting**: Configurable limits on all endpoints
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Pydantic models with strict validation
- **Password Security**: Secure hashing for sensitive data

## 🏗 Project Structure

```
├── components/              # React components
│   ├── icons/              # SVG icon components
│   ├── AddClientModal.tsx  # MCP client management
│   ├── CompanyChatWidget.tsx # Company chat with RAG
│   ├── McpChatWidget.tsx   # Per-server MCP chat
│   ├── LoginPage.tsx       # Authentication UI
│   ├── MainPage.tsx        # Main dashboard
│   ├── OtpInput.tsx        # OTP entry component
│   └── ...
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── core/           # Configuration and security
│   │   ├── routes/         # API endpoints
│   │   │   ├── company_chat.py # Company chat API
│   │   │   └── mcp_chat.py     # MCP chat API
│   │   ├── db/
│   │   │   └── models.py   # Database models with pgvector
│   │   ├── services/       # Business logic
│   │   │   ├── companyChat.py  # Company chat service
│   │   │   └── mcpChat.py      # MCP chat service
│   │   ├── llm/            # LLM integration
│   │   │   └── ollamaClient.py # Production Ollama client
│   │   ├── clients/        # External service clients
│   │   │   └── mcpMemoryClient.py # MCP memory integration
│   │   └── schemas/        # Pydantic schemas
│   ├── alembic/            # Database migrations
│   ├── scripts/            # Utility scripts
│   │   └── load_company_docs.py # Document loader
│   ├── tests/              # Test files
│   └── requirements.txt    # Python dependencies
├── deploy/                 # Docker and deployment
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── cloudbuild.yaml
├── .env.example           # Environment template
├── docker-compose.yml     # Docker services
└── package.json          # Node.js configuration
```

## 🔧 Configuration

### Environment Variables

The application uses a comprehensive `.env` file for configuration. Key settings include:

- **API_BASE_URL**: Backend API endpoint
- **DATABASE_URL**: Database connection string
- **REDIS_URL**: Redis connection string
- **SMTP_***: Email configuration
- **JWT_***: Authentication settings
- **RATE_LIMIT_***: API rate limiting

### Email Providers

While Gmail is recommended, you can use any SMTP provider:

```env
# Outlook/Hotmail
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587

# Yahoo
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587

# Custom SMTP
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## 📖 API Documentation

Once the backend is running, access interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### 🤖 AI Chat Features

#### Company Chat API

```bash
# Start a company chat conversation
POST /api/v1/chat/company
{
  "message": "What are our company policies?",
  "thread_id": "optional-thread-id",
  "model": "llama3.2:3b"
}

# Streaming response with RAG context
Response: Server-Sent Events (SSE) stream
data: {"type": "source", "content": {"title": "Policy Document", "content": "..."}}
data: {"type": "chunk", "content": "Based on company policies..."}
data: {"type": "done"}
```

#### MCP Chat API

```bash
# Chat with specific MCP server
POST /api/v1/chat/mcp/{server_id}
{
  "message": "Show me the system status",
  "thread_id": "optional-thread-id",
  "model": "llama3.2:3b"
}

# Clear MCP server conversation history
DELETE /api/v1/chat/mcp/{server_id}/clear?thread_id=optional-thread-id
```

#### Health Monitoring

```bash
# Check Ollama service health
GET /api/v1/health/ollama

# Check all services health
GET /api/v1/health/all
```

### 🔧 Frontend Integration

The React components provide streaming chat interfaces:

```tsx
// Company Chat Widget
<CompanyChatWidget 
  onClose={() => setShowCompanyChat(false)}
  className="fixed bottom-4 right-4 w-96 h-96"
/>

// MCP Chat Widget
<McpChatWidget 
  server={selectedServer}
  onClose={() => setShowMcpChat(false)}
  className="fixed bottom-4 right-4 w-96 h-96"
/>
```

## 🧪 Testing

### Unit Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend
pytest -v

# Backend tests with coverage
pytest --cov=app --cov-report=html
```

### Integration Testing

Test the complete Ollama integration:

```bash
# Install test dependencies
pip install httpx

# Run integration test (with backend running)
python test_ollama_integration.py

# Test specific endpoints
python test_ollama_integration.py http://localhost:8000
```

### Manual Testing

1. **Company Chat**: Ask about company information to test RAG functionality
2. **MCP Chat**: Test per-server conversations with different MCP servers
3. **Streaming**: Verify real-time response streaming works correctly
4. **Health Checks**: Monitor service health at `/api/v1/health/all`

### Load Testing

```bash
# Install load testing tools
pip install locust

# Create test scenarios (example)
locust -f backend/tests/load_test.py --host=http://localhost:8000
```

## 🚀 Deployment

### Google Cloud Run

The application includes complete Google Cloud deployment configuration:

```bash
# Build and deploy using Cloud Build
gcloud builds submit --config deploy/cloudbuild.yaml

# Or deploy manually
docker build -f deploy/Dockerfile.backend -t gcr.io/PROJECT_ID/backend .
docker build -f deploy/Dockerfile.frontend -t gcr.io/PROJECT_ID/frontend .
gcloud run deploy backend --image gcr.io/PROJECT_ID/backend
gcloud run deploy frontend --image gcr.io/PROJECT_ID/frontend
```

### Environment Variables for Production

Update your production environment with:

```env
ENV=production
DEBUG=false
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://production-redis:6379/0
ALLOWED_ORIGINS=https://yourdomain.com
SECRET_KEY=production-secret-key
```

## � Troubleshooting

### Common Issues

1. **Email not sending**: Check SMTP credentials and app password setup
2. **CORS errors**: Verify `ALLOWED_ORIGINS` includes your frontend URL
3. **WebSocket connection failed**: Ensure backend is accessible and CORS is configured
4. **Database errors**: Check `DATABASE_URL` and ensure PostgreSQL is running
5. **Redis connection failed**: Verify Redis server is running and accessible
6. **Ollama connection failed**: 
   - Ensure Ollama is running on the correct port (11434)
   - Check `OLLAMA_BASE_URL` environment variable
   - Verify required models are installed: `ollama list`
7. **pgvector extension missing**: 
   - Install pgvector: `CREATE EXTENSION vector;` in PostgreSQL
   - Run migrations: `alembic upgrade head`
8. **Chat responses empty**: 
   - Check if company documents are loaded
   - Verify embedding model is available: `ollama pull nomic-embed-text`
9. **Streaming issues**: 
   - Check browser network tab for SSE connection errors
   - Verify FastAPI is handling streaming endpoints correctly

### Debug Mode

Enable debug logging:

```env
DEBUG=true
LOG_LEVEL=DEBUG
```

View logs:

```bash
# Docker logs
docker-compose logs -f backend

# Development logs
tail -f backend/app.log
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🔗 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Google Cloud Run](https://cloud.google.com/run)
