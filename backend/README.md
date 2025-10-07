# Backend README

## Dark Matter MCP Backend

FastAPI backend for the Model Context Protocol client application.

### Features

- **Email OTP Authentication**: Secure login with one-time passwords
- **JWT Token Management**: Access and refresh token handling
- **MCP Server Management**: CRUD operations for MCP server configurations
- **Real-time Communication**: WebSocket support for MCP interactions
- **Security**: Rate limiting, CORS, input validation
- **Database**: SQLModel with async support

### Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -e .
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run Development Server**:
   ```bash
   python run.py
   ```

4. **API Documentation**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./app.db` |
| `SECRET_KEY` | JWT signing key | Required |
| `SENDGRID_API_KEY` | SendGrid API key for emails | Optional |
| `REDIS_URL` | Redis connection for OTP storage | `redis://localhost:6379/0` |

### API Endpoints

- `GET /healthz` - Health check
- `POST /api/v1/auth/otp/request` - Request OTP
- `POST /api/v1/auth/otp/verify` - Verify OTP and login
- `GET /api/v1/user/profile` - Get user profile
- `GET /api/v1/servers` - List MCP servers
- `WS /ws/server/{server_id}` - WebSocket for real-time communication

### Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black .

# Lint code
ruff check .

# Type checking
mypy .
```