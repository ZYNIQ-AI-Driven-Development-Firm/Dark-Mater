"""
Authentication routes.
"""
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import async_engine
from app.auth.dependencies import get_async_session
from app.auth.jwt import JWTHandler, hash_token
from app.db.models import User, RefreshToken
from app.schemas import (
    OtpRequest, OtpVerify, TokenResponse, TokenRefresh, 
    LogoutRequest, UserResponse, ErrorResponse, SuccessResponse
)
from app.services.otp import OTPService
from app.services.email import EmailService
from app.core.config import get_settings

router = APIRouter()
otp_service = OTPService()
email_service = EmailService()
settings = get_settings()


@router.post("/otp/request", response_model=dict)
async def request_otp(
    request: OtpRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Request OTP for email authentication."""
    try:
        can_request, cooldown = await otp_service.can_request_otp(request.email)
        
        if not can_request:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {cooldown} seconds before requesting another code"
            )
        
        # Generate and store OTP
        otp = await otp_service.generate_and_store_otp(request.email)
        
        # In development/test mode, skip email sending and return OTP directly
        if settings.ENV in ["development", "test"]:
            print(f"🔧 DEV MODE: OTP for {request.email}: {otp}")
            return {
                "status": "sent", 
                "cooldown_sec": 30,
                "dev_otp": otp  # Return OTP directly in dev mode
            }
        
        # In production, send email
        email_sent = await email_service.send_otp_email(request.email, otp)
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email"
            )
        
        return {"status": "sent", "cooldown_sec": 30}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(
    request: OtpVerify,
    session: AsyncSession = Depends(get_async_session)
):
    """Verify OTP and authenticate user."""
    try:
        # Verify OTP
        is_valid = await otp_service.verify_otp(request.email, request.code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired OTP"
            )
        
        # Check if user exists
        statement = select(User).where(User.email == request.email)
        result = await session.execute(statement)
        user = result.scalar_one_or_none()
        
        is_new_user = False
        
        if not user:
            # Create new user with simple username
            username = request.email.split("@")[0]  # Use email prefix as default username
            
            user = User(
                username=username,
                email=request.email,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            is_new_user = True
        
        # Create tokens
        access_token = JWTHandler.create_access_token(subject=str(user.id))
        refresh_token = JWTHandler.create_refresh_token(subject=str(user.id))
        
        # Store refresh token
        refresh_token_record = RefreshToken(
            token_hash=hash_token(refresh_token),
            user_id=user.id,
            device_fingerprint=request.device_fingerprint,
            expires_at=datetime.utcnow() + timedelta(days=7),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(refresh_token_record)
        await session.commit()
        
        # Create UserResponse manually to avoid async issues
        user_response = UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            is_new_user=is_new_user,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Log the actual error for debugging
        import traceback
        print(f"Error in OTP verify: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/refresh", response_model=dict)
async def refresh_token(
    request: TokenRefresh,
    session: AsyncSession = Depends(get_async_session)
):
    """Refresh access token using refresh token."""
    try:
        # Decode refresh token
        payload = JWTHandler.decode_token(request.refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = UUID(payload.get("sub"))
        
        # Check if refresh token exists and is valid
        statement = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        )
        result = await session.execute(statement)
        refresh_token_record = result.scalar_one_or_none()
        
        if not refresh_token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Create new tokens
        new_access_token = JWTHandler.create_access_token(subject=str(user_id))
        new_refresh_token = JWTHandler.create_refresh_token(subject=str(user_id))
        
        # Update refresh token record
        refresh_token_record.token_hash = hash_token(new_refresh_token)
        refresh_token_record.expires_at = datetime.utcnow() + timedelta(days=7)
        refresh_token_record.updated_at = datetime.utcnow()
        
        await session.commit()
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    request: LogoutRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Logout user by revoking refresh token."""
    try:
        # Decode refresh token to get user ID
        payload = JWTHandler.decode_token(request.refresh_token)
        if payload and payload.get("type") == "refresh":
            user_id = UUID(payload.get("sub"))
            
            # Revoke all refresh tokens for this user
            statement = select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False
            )
            result = await session.execute(statement)
            tokens = result.scalars().all()
            
            for token in tokens:
                token.is_revoked = True
                token.updated_at = datetime.utcnow()
            
            await session.commit()
        
        return SuccessResponse(status="ok")
        
    except Exception:
        # Even if logout fails, return success to prevent information leakage
        return SuccessResponse(status="ok")