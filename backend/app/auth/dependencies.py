"""
Authentication dependencies for FastAPI.
"""
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import JWTHandler
from app.db.database import async_engine
from app.db.models import User

security = HTTPBearer()


async def get_async_session():
    """Get async database session."""
    async with AsyncSession(async_engine, expire_on_commit=False) as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_async_session),
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = JWTHandler.decode_token(token)
    
    if payload is None:
        raise credentials_exception

    token_type = payload.get("type")
    if token_type != "access":
        raise credentials_exception

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    # Get user from database
    statement = select(User).where(User.id == user_id, User.is_active == True)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> Optional[str]:
    """Get current user ID if authenticated, None otherwise.""" 
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = JWTHandler.decode_token(token)
    
    if payload is None:
        return None
    
    token_type = payload.get("type")
    if token_type != "access":
        return None
        
    return payload.get("sub")