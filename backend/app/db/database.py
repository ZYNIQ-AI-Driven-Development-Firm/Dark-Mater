"""
Database configuration and connection management.
"""
from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# Sync engine for migrations
sync_engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)

# Async engine for main application
if settings.DATABASE_URL.startswith("sqlite"):
    async_database_url = settings.DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")
elif settings.DATABASE_URL.startswith("postgresql"):
    async_database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
else:
    async_database_url = settings.DATABASE_URL

async_engine: AsyncEngine = create_async_engine(
    async_database_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
)


async def get_db_session():
    """Get async database session."""
    from sqlalchemy.ext.asyncio import AsyncSession
    
    async with AsyncSession(async_engine) as session:
        yield session


async def create_db_and_tables():
    """Create database tables."""
    from app.db.models import User, McpServer, ToolExecution, RefreshToken  # Import specific models
    
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)