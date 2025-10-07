"""
Ollama LLM integration service.
"""
import logging
from typing import Dict, List, Optional, Any
import httpx
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class OllamaService:
    """Service for interacting with Ollama LLM API."""
    
    def __init__(self):
        self.base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.timeout = 30.0
        
    async def check_connection(self) -> Dict[str, Any]:
        """Check if Ollama is running and accessible."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json()
                    return {
                        "connected": True,
                        "status": "online",
                        "models": models.get("models", []),
                        "model_count": len(models.get("models", []))
                    }
                else:
                    return {
                        "connected": False,
                        "status": "error",
                        "error": f"HTTP {response.status_code}"
                    }
        except Exception as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            return {
                "connected": False,
                "status": "offline",
                "error": str(e)
            }
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """Get list of available models."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return data.get("models", [])
                return []
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
            return []
    
    async def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific model."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/show",
                    json={"name": model_name}
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get model info for {model_name}: {e}")
            return None
    
    async def generate_completion(
        self, 
        model: str, 
        prompt: str, 
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate text completion using Ollama."""
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": stream,
                **kwargs
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"HTTP {response.status_code}",
                        "detail": response.text
                    }
        except Exception as e:
            logger.error(f"Failed to generate completion: {e}")
            return {
                "error": str(e)
            }
    
    async def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using Ollama."""
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": stream,
                **kwargs
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"HTTP {response.status_code}",
                        "detail": response.text
                    }
        except Exception as e:
            logger.error(f"Failed to generate chat completion: {e}")
            return {
                "error": str(e)
            }

    async def pull_model(self, model_name: str) -> Dict[str, Any]:
        """Pull/download a model from Ollama registry."""
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes for model download
                response = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": model_name}
                )
                
                if response.status_code == 200:
                    return {"success": True, "model": model_name}
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                        "detail": response.text
                    }
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def delete_model(self, model_name: str) -> Dict[str, Any]:
        """Delete a model from Ollama."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.base_url}/api/delete",
                    json={"name": model_name}
                )
                
                if response.status_code == 200:
                    return {"success": True, "model": model_name}
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                        "detail": response.text
                    }
        except Exception as e:
            logger.error(f"Failed to delete model {model_name}: {e}")
            return {
                "success": False,
                "error": str(e)
            }