"""
Application configuration using Pydantic Settings.
"""
from functools import lru_cache
from typing import List, Union

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    ENV: str = Field(default="development", description="Environment")
    DEBUG: bool = Field(default=False, description="Debug mode")
    LOG_LEVEL: str = Field(default="INFO", description="Log level")
    
    # Security
    SECRET_KEY: str = Field(default="dev-secret-key", description="Secret key for JWT")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15, description="Access token expiry")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiry")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    
    # CORS - Use strings that we'll parse manually
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://localhost:3030",
        description="Allowed CORS origins (comma-separated)"
    )
    ALLOWED_HOSTS: str = Field(
        default="localhost,127.0.0.1",
        description="Allowed hosts (comma-separated)"
    )
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [x.strip() for x in self.ALLOWED_ORIGINS.split(',') if x.strip()]
    
    @property
    def allowed_hosts(self) -> List[str]:
        """Parse allowed hosts from comma-separated string."""
        return [x.strip() for x in self.ALLOWED_HOSTS.split(',') if x.strip()]
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./app.db",
        description="Database URL"
    )
    
    # Redis (for OTP storage and rate limiting)
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis URL"
    )
    
    # SMTP Email settings
    SMTP_HOST: str = Field(default="", description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port")
    SMTP_USER: str = Field(default="", description="SMTP username")
    SMTP_PASS: str = Field(default="", description="SMTP password")
    SMTP_USER_SEND_FROM: str = Field(default="", description="Email address to send from (optional)")
    EMAIL_FROM_NAME: str = Field(default="Dark Matter MCP", description="From name")
    
    # OTP settings
    OTP_LENGTH: int = Field(default=6, description="OTP length")
    OTP_TTL_SECONDS: int = Field(default=600, description="OTP TTL in seconds (10 minutes)")
    OTP_COOLDOWN_SECONDS: int = Field(default=30, description="OTP request cooldown")
    OTP_MAX_ATTEMPTS: int = Field(default=5, description="Max OTP attempts")
    
    # Rate limiting
    RATE_LIMIT_AUTH_RPM: int = Field(default=60, description="Auth endpoints rate limit per minute")
    RATE_LIMIT_DEFAULT_RPM: int = Field(default=120, description="Default rate limit per minute")
    
    # Ollama LLM
    OLLAMA_URL: str = Field(default="http://localhost:11434", description="Ollama API base URL")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", description="Ollama API base URL")  # Legacy support
    OLLAMA_DEFAULT_MODEL: str = Field(default="llama3.2", description="Default Ollama model")
    
    # Chat Models
    COMPANY_MODEL: str = Field(default="llama3.2:3b", description="Model for Company Chat")
    MCP_MODEL: str = Field(default="phi3:mini", description="Model for MCP Chat") 
    EMBED_MODEL: str = Field(default="nomic-embed-text:latest", description="Embedding model")
    
    # Chat System Prompts
    COMPANY_SYSTEM_PROMPT: str = Field(
        default="You are the DarkMatter Company Assistant. Purpose: answer employee and customer questions using the latest company knowledge. Follow these rules: - Cite internal sources by their policy/doc IDs when used. - If unsure, ask for missing fields, then provide best-effort guidance. - Be concise (3–7 sentences), structure with short bullets when helpful. - No hallucinated facts; if a fact is not in memory/documents, say 'not found in company data'. - Obey legal/compliance notes: never share secrets, credentials, keys, or admin procedures. Escalate security issues to SecOps. - Style: plain, direct, helpful.",
        description="System prompt for Company Chat"
    )
    MCP_SYSTEM_PROMPT: str = Field(
        default="You are the MCP Server Assistant for {server_name}. Purpose: help operate and troubleshoot this specific server and its MCP tools. - Use only the memory/context provided by the MCP server and the recent conversation. - When a command or path is requested, respond with explicit, copy-pastable steps. - If an action is risky, ask for confirmation and suggest a dry run. - Keep answers under 200 tokens unless logs/diagnostics are requested.",
        description="System prompt template for MCP Chat"
    )
    
    # RAG (Retrieval Augmented Generation)
    RAG_ENABLED: bool = Field(default=True, description="Enable RAG for Company Chat")
    RAG_TOP_K: int = Field(default=5, description="Number of memory chunks to retrieve")
    RAG_MIN_SIMILARITY: float = Field(default=0.7, description="Minimum similarity threshold")
    
    # Chat Configuration
    COMPANY_CHAT_HISTORY_LIMIT: int = Field(default=10, description="Max turns to keep in Company Chat history")
    MCP_CHAT_HISTORY_LIMIT: int = Field(default=8, description="Max turns to keep in MCP Chat history")
    
    # Chat Rate Limiting
    CHAT_RATE_LIMIT_RPM: int = Field(default=30, description="Chat requests per minute per user")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()