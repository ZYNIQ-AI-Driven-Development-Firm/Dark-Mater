"""
Authentication middleware for rate limiting and security.
"""
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
from collections import defaultdict, deque


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        self.requests = defaultdict(deque)
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Check if request is allowed under rate limit."""
        now = time.time()
        # Clean old requests
        while self.requests[key] and self.requests[key][0] <= now - window:
            self.requests[key].popleft()
        
        # Check limit
        if len(self.requests[key]) >= limit:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True


rate_limiter = RateLimiter()


class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication and rate limiting middleware."""
    
    def __init__(self, app):
        super().__init__(app)
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Rate limiting for auth endpoints
        if request.url.path.startswith("/api/v1/auth/"):
            if not rate_limiter.is_allowed(f"auth:{client_ip}", 60, 60):  # 60 requests per minute
                return JSONResponse(
                    status_code=429,
                    content={"success": False, "error": "Rate limit exceeded"}
                )
        else:
            # General rate limiting
            if not rate_limiter.is_allowed(f"general:{client_ip}", 120, 60):  # 120 requests per minute
                return JSONResponse(
                    status_code=429,
                    content={"success": False, "error": "Rate limit exceeded"}
                )
        
        # Process request
        response = await call_next(request)
        return response