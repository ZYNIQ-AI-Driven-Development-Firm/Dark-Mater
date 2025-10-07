"""
Health check endpoints.
"""
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
import redis.asyncio as redis
from sqlmodel import Session, text

from app.core.config import get_settings
from app.db.database import get_db_session
from app.llm.ollamaClient import get_ollama_client

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()


@router.get("/healthz")
@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "ok",
        "ts": datetime.utcnow().isoformat(),
    }


@router.get("/api/health/ollama")
async def ollama_health():
    """Check Ollama health and available models."""
    try:
        ollama_client = get_ollama_client()
        health_info = await ollama_client.health_check()
        
        if health_info.get("connected"):
            models = health_info.get("models", [])
            current_model = models[0].get("name") if models else None
            return {
                "ok": True,
                "status": "connected",
                "models": [model.get("name", "unknown") for model in models],
                "model_count": len(models),
                "current_model": current_model
            }
        else:
            return {
                "ok": False,
                "status": "disconnected",
                "models": [],
                "model_count": 0,
                "error": health_info.get("error", "Ollama not available")
            }
            
    except Exception as e:
        logger.error(f"Ollama health check failed: {e}")
        return {
            "ok": False,
            "status": "error",
            "models": [],
            "model_count": 0,
            "error": str(e)
        }


@router.get("/api/health/db")
async def database_health():
    """Check database connectivity."""
    try:
        async with get_db_session() as session:
            # Test query to verify connection
            result = await session.exec(text("SELECT 1 as test"))
            test_value = result.fetchone()
            
            if test_value and test_value[0] == 1:
                return {
                    "ok": True,
                    "status": "connected",
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                raise Exception("Test query failed")
                
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "ok": False,
                "status": "error",
                "error": str(e)
            }
        )


@router.get("/api/health/redis")
async def redis_health():
    """Check Redis connectivity."""
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        # Test ping
        await redis_client.ping()
        
        # Test set/get
        test_key = "health_check"
        test_value = datetime.utcnow().isoformat()
        
        await redis_client.set(test_key, test_value, ex=60)  # 60 second expiry
        retrieved_value = await redis_client.get(test_key)
        
        await redis_client.close()
        
        if retrieved_value == test_value:
            return {
                "ok": True,
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise Exception("Redis read/write test failed")
            
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "ok": False,
                "status": "error", 
                "error": str(e)
            }
        )


@router.get("/api/health/all")
async def all_services_health():
    """Check health of all services."""
    services = {}
    overall_status = "healthy"
    
    # Check database
    try:
        db_result = await database_health()
        services["database"] = {
            "status": "healthy",
            "connected": True
        }
    except Exception as e:
        services["database"] = {
            "status": "unhealthy",
            "connected": False,
            "error": str(e)
        }
        overall_status = "degraded"
    
    # Check Redis
    try:
        redis_result = await redis_health()
        services["redis"] = {
            "status": "healthy", 
            "connected": True
        }
    except Exception as e:
        services["redis"] = {
            "status": "unhealthy",
            "connected": False,
            "error": str(e)
        }
        overall_status = "degraded"
    
    # Check Ollama
    try:
        ollama_result = await ollama_health()
        services["ollama"] = {
            "status": "healthy" if ollama_result["ok"] else "unhealthy",
            "connected": ollama_result["ok"],
            "models": ollama_result.get("models", []),
            "model_count": ollama_result.get("model_count", 0),
            "current_model": ollama_result.get("current_model"),
            "error": ollama_result.get("error")
        }
        if not ollama_result["ok"]:
            overall_status = "degraded"
    except Exception as e:
        services["ollama"] = {
            "status": "unhealthy",
            "connected": False,
            "error": str(e)
        }
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "services": services
    }