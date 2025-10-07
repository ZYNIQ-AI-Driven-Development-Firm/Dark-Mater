"""
FastAPI application factory for Dark Matter MCP Backend.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.auth.middleware import AuthMiddleware
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.database import create_db_and_tables
from app.routes import auth, health, servers, users, websocket, ollama, company_chat, mcp_chat


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    # Startup
    await create_db_and_tables()
    yield
    # Shutdown
    pass


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    setup_logging(settings.LOG_LEVEL)
    
    app = FastAPI(
        title="Dark Matter MCP API",
        description="Backend API for Model Context Protocol Client",
        version="1.0.0",
        docs_url="/docs" if settings.ENV != "production" else None,
        redoc_url="/redoc" if settings.ENV != "production" else None,
        lifespan=lifespan,
    )

    # Security middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom auth middleware
    app.add_middleware(AuthMiddleware)

    # Include routers
    app.include_router(health.router, tags=["health"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(users.router, prefix="/api/v1/user", tags=["users"])
    app.include_router(servers.router, prefix="/api/v1/servers", tags=["servers"])
    app.include_router(ollama.router, prefix="/api/v1/ollama", tags=["ollama"])
    app.include_router(company_chat.router, prefix="/api/v1/company-chat", tags=["company-chat"])
    app.include_router(mcp_chat.router, prefix="/api/v1/mcp-chat", tags=["mcp-chat"])
    app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

    return app