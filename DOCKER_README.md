# Docker Deployment Guide

This guide explains how to deploy the Dark Matter MCP application using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Google Cloud SDK (for production deployment)
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## Local Development with Docker

### 1. Environment Setup

Copy the environment example file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

### 2. Start Services

Start all services with Docker Compose:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis cache on port 6379
- Backend API on port 8000
- Frontend application on port 3030

### 3. Access the Application

- Frontend: http://localhost:3030
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 5. Stop Services

```bash
docker-compose down
```

## Production Deployment on Google Cloud

### 1. Prerequisites

Ensure you have:
- Google Cloud Project with billing enabled
- `gcloud` CLI installed and authenticated
- Required permissions for Cloud Run, Cloud Build, and Secret Manager

### 2. Configuration

Set environment variables:
```bash
export PROJECT_ID=your-project-id
export REGION=us-central1
```

### 3. Deploy

Run the deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

Or step by step:
```bash
# Check prerequisites
./deploy.sh prerequisites

# Set up Google Cloud
./deploy.sh setup

# Create secrets
./deploy.sh secrets

# Deploy application
./deploy.sh deploy

# Get service URLs
./deploy.sh urls
```

### 4. Manual Secrets Setup

If you need to set secrets manually:

```bash
# Create secret key
echo -n "your-secret-key" | gcloud secrets create darkmatter-secret-key --data-file=-

# Create SendGrid API key (optional)
echo -n "your-sendgrid-key" | gcloud secrets create sendgrid-api-key --data-file=-

# Create database URL (if using external database)
echo -n "postgresql://user:pass@host:5432/db" | gcloud secrets create database-url --data-file=-

# Create Redis URL (if using external Redis)
echo -n "redis://host:6379/0" | gcloud secrets create redis-url --data-file=-
```

## Docker Commands Reference

### Build Images Locally

```bash
# Backend
docker build -f backend/Dockerfile -t darkmatter-backend .

# Frontend
docker build -f Dockerfile -t darkmatter-frontend .
```

### Run Individual Containers

```bash
# Backend (requires database and Redis)
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379/0 \
  -e SECRET_KEY=your-secret-key \
  darkmatter-backend

# Frontend
docker run -p 3030:80 \
  -e VITE_API_BASE_URL=http://localhost:8000 \
  -e VITE_WS_BASE_URL=ws://localhost:8000 \
  darkmatter-frontend
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3030, 8000, 5432, and 6379 are available
2. **Database connection**: Check that PostgreSQL is running and accessible
3. **CORS errors**: Verify ALLOWED_ORIGINS includes your frontend URL
4. **WebSocket connection**: Ensure WebSocket proxy is configured correctly

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service-name]

# Connect to container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Check database connection
docker-compose exec postgres psql -U postgres -d darkmatter_mcp

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### Performance Tuning

For production deployment, consider:

1. **Resource allocation**: Adjust memory and CPU limits in Cloud Run
2. **Auto-scaling**: Configure min/max instances based on load
3. **Database**: Use Cloud SQL for managed PostgreSQL
4. **Cache**: Use Cloud Memorystore for managed Redis
5. **CDN**: Use Cloud CDN for static assets
6. **Monitoring**: Set up Cloud Monitoring and alerting

## Security Considerations

1. **Secrets Management**: Always use Secret Manager for sensitive data
2. **Network Security**: Configure VPC and firewall rules appropriately
3. **HTTPS**: Ensure all production traffic uses HTTPS
4. **Authentication**: Implement proper JWT token management
5. **CORS**: Configure CORS settings restrictively
6. **Headers**: Security headers are configured in nginx.conf

## Monitoring and Logging

- Cloud Run provides built-in metrics and logging
- Use Cloud Monitoring for custom metrics and alerts
- Configure structured logging in the application
- Set up error reporting with Cloud Error Reporting

## Backup and Recovery

1. **Database**: Regular backups of Cloud SQL instance
2. **Secrets**: Document secret recovery procedures
3. **Configuration**: Version control all configuration files
4. **Container Images**: Maintain image registry with versioned releases