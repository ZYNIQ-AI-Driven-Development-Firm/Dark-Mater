"""
Ollama LLM routes.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_active_user
from app.db.models import User
from app.services.ollama import OllamaService

router = APIRouter()
ollama_service = OllamaService()


# Schemas
class ChatMessage(BaseModel):
    """Chat message schema."""
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    """Chat request schema."""
    model: str
    messages: List[ChatMessage]
    stream: bool = False
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1)


class CompletionRequest(BaseModel):
    """Completion request schema."""
    model: str
    prompt: str
    stream: bool = False
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1)


class ModelPullRequest(BaseModel):
    """Model pull request schema."""
    name: str


class OllamaStatusResponse(BaseModel):
    """Ollama status response schema."""
    connected: bool
    status: str
    model_count: Optional[int] = None
    current_model: Optional[str] = None
    error: Optional[str] = None


@router.get("/status", response_model=OllamaStatusResponse)
async def get_ollama_status(
    current_user: User = Depends(get_current_active_user)
):
    """Get Ollama connection status and available models."""
    status_info = await ollama_service.check_connection()
    
    current_model = None
    if status_info.get("connected") and status_info.get("models"):
        # Get the first available model as default
        models = status_info.get("models", [])
        if models:
            current_model = models[0].get("name")
    
    return OllamaStatusResponse(
        connected=status_info.get("connected", False),
        status=status_info.get("status", "unknown"),
        model_count=status_info.get("model_count", 0),
        current_model=current_model,
        error=status_info.get("error")
    )


@router.get("/models")
async def list_models(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available Ollama models."""
    models = await ollama_service.list_models()
    return {"models": models}


@router.get("/models/{model_name}")
async def get_model_info(
    model_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed information about a specific model."""
    model_info = await ollama_service.get_model_info(model_name)
    if model_info is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model '{model_name}' not found"
        )
    return model_info


@router.post("/chat")
async def chat_completion(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Generate chat completion using Ollama."""
    # Convert Pydantic models to dict
    messages = [msg.dict() for msg in request.messages]
    
    # Prepare kwargs
    kwargs = {}
    if request.temperature is not None:
        kwargs["temperature"] = request.temperature
    if request.max_tokens is not None:
        kwargs["max_tokens"] = request.max_tokens
    
    result = await ollama_service.chat_completion(
        model=request.model,
        messages=messages,
        stream=request.stream,
        **kwargs
    )
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result


@router.post("/generate")
async def generate_completion(
    request: CompletionRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Generate text completion using Ollama."""
    # Prepare kwargs
    kwargs = {}
    if request.temperature is not None:
        kwargs["temperature"] = request.temperature
    if request.max_tokens is not None:
        kwargs["max_tokens"] = request.max_tokens
    
    result = await ollama_service.generate_completion(
        model=request.model,
        prompt=request.prompt,
        stream=request.stream,
        **kwargs
    )
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result


@router.post("/models/pull")
async def pull_model(
    request: ModelPullRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Pull/download a model from Ollama registry."""
    result = await ollama_service.pull_model(request.name)
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to pull model")
        )
    
    return result


@router.delete("/models/{model_name}")
async def delete_model(
    model_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a model from Ollama."""
    result = await ollama_service.delete_model(model_name)
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to delete model")
        )
    
    return result