"""
User management routes.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_async_session, get_current_active_user
from app.db.models import User
from app.schemas import UserResponse, UserUpdate

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Update user profile."""
    if user_update.username:
        # Check if username is already taken
        from sqlmodel import select
        statement = select(User).where(
            User.username == user_update.username,
            User.id != current_user.id
        )
        result = await session.execute(statement)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )
        
        current_user.username = user_update.username
    
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/delete")
async def request_account_deletion(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Request account deletion with 7-day grace period."""
    from datetime import timedelta
    
    # Set deletion grace period
    current_user.deletion_grace_period = datetime.utcnow() + timedelta(days=7)
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    
    session.add(current_user)
    await session.commit()
    
    return {
        "message": "Account deletion scheduled",
        "grace_period_ends": current_user.deletion_grace_period,
        "days_remaining": 7
    }


@router.post("/cancel-deletion")
async def cancel_account_deletion(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Cancel account deletion and reactivate account."""
    current_user.deletion_grace_period = None
    current_user.is_active = True
    current_user.updated_at = datetime.utcnow()
    
    session.add(current_user)
    await session.commit()
    
    return {
        "message": "Account deletion cancelled and account reactivated"
    }