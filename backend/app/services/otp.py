"""
OTP (One-Time Password) service for email-based authentication.
"""
import hashlib
import hmac
import random
import secrets
from datetime import datetime, timedelta
from typing import Optional

import redis.asyncio as redis
from loguru import logger

from app.core.config import get_settings

settings = get_settings()


class OTPService:
    """OTP service for generating and validating one-time passwords."""
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
    
    def _generate_otp(self) -> str:
        """Generate a 6-digit OTP."""
        return f"{random.randint(100000, 999999):06d}"
    
    def _hash_otp(self, otp: str, email: str) -> str:
        """Hash OTP with email as salt using HMAC."""
        message = f"{otp}:{email}"
        return hmac.new(
            settings.SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def _get_redis_key(self, email: str, key_type: str) -> str:
        """Get Redis key for OTP storage."""
        return f"otp:{key_type}:{email}"
    
    async def can_request_otp(self, email: str) -> tuple[bool, int]:
        """Check if user can request a new OTP (cooldown check)."""
        cooldown_key = self._get_redis_key(email, "cooldown")
        
        cooldown_until = await self.redis_client.get(cooldown_key)
        if cooldown_until:
            remaining = int(cooldown_until) - int(datetime.utcnow().timestamp())
            if remaining > 0:
                return False, remaining
        
        return True, 0
    
    async def generate_and_store_otp(self, email: str) -> str:
        """Generate OTP and store in Redis with TTL."""
        # Check attempts
        attempts_key = self._get_redis_key(email, "attempts")
        attempts = await self.redis_client.get(attempts_key)
        
        if attempts and int(attempts) >= settings.OTP_MAX_ATTEMPTS:
            # Reset attempts after cooldown period
            await self.redis_client.delete(attempts_key)
            await self.redis_client.setex(
                self._get_redis_key(email, "cooldown"),
                settings.OTP_COOLDOWN_SECONDS * 2,  # Double cooldown after max attempts
                int(datetime.utcnow().timestamp() + settings.OTP_COOLDOWN_SECONDS * 2)
            )
            raise ValueError("Too many OTP attempts. Please try again later.")
        
        # Generate OTP
        otp = self._generate_otp()
        hashed_otp = self._hash_otp(otp, email)
        
        # Store hashed OTP
        otp_key = self._get_redis_key(email, "code")
        await self.redis_client.setex(otp_key, settings.OTP_TTL_SECONDS, hashed_otp)
        
        # Set cooldown
        cooldown_key = self._get_redis_key(email, "cooldown")
        await self.redis_client.setex(
            cooldown_key,
            settings.OTP_COOLDOWN_SECONDS,
            int(datetime.utcnow().timestamp() + settings.OTP_COOLDOWN_SECONDS)
        )
        
        logger.info(f"Generated OTP for {email}: {otp}")  # Log OTP for testing
        return otp
    
    async def verify_otp(self, email: str, otp: str) -> bool:
        """Verify OTP against stored hash."""
        # Get stored hash
        otp_key = self._get_redis_key(email, "code")
        stored_hash = await self.redis_client.get(otp_key)
        
        if not stored_hash:
            return False
        
        # Hash provided OTP
        provided_hash = self._hash_otp(otp, email)
        
        # Compare hashes
        is_valid = hmac.compare_digest(stored_hash.decode(), provided_hash)
        
        if is_valid:
            # Delete OTP after successful verification (single use)
            await self.redis_client.delete(otp_key)
            await self.redis_client.delete(self._get_redis_key(email, "attempts"))
            logger.info(f"Successfully verified OTP for {email}")
        else:
            # Increment attempts
            attempts_key = self._get_redis_key(email, "attempts")
            attempts = await self.redis_client.incr(attempts_key)
            await self.redis_client.expire(attempts_key, settings.OTP_TTL_SECONDS)
            logger.warning(f"Invalid OTP attempt for {email} (attempt {attempts})")
        
        return is_valid
    
    async def cleanup_expired(self):
        """Cleanup expired OTP data (called by background task)."""
        # This would be implemented as a background task
        # For now, Redis TTL handles the cleanup automatically
        pass