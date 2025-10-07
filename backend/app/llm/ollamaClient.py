"""
Production-ready Ollama client with streaming support and robust error handling.
"""
import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, AsyncGenerator, Union
from dataclasses import dataclass
from enum import Enum
import httpx
from httpx import AsyncClient, TimeoutException, ConnectError

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ModelError(Exception):
    """Model-related errors (missing model, etc.)"""
    pass


class ValidationError(Exception):
    """Request validation errors"""
    pass


class TransportError(Exception):
    """Network/transport errors"""
    pass


class StreamingError(Exception):
    """Streaming-specific errors"""
    pass


@dataclass
class StreamChunk:
    """Represents a chunk in streaming response"""
    content: str
    done: bool = False
    model: Optional[str] = None
    created_at: Optional[str] = None
    response: Optional[str] = None
    context: Optional[List[int]] = None


@dataclass
class CompletionStats:
    """Completion statistics"""
    eval_count: Optional[int] = None
    eval_duration: Optional[int] = None
    load_duration: Optional[int] = None
    prompt_eval_count: Optional[int] = None
    prompt_eval_duration: Optional[int] = None
    total_duration: Optional[int] = None


@dataclass
class GenerateOptions:
    """Options for generate/chat requests"""
    model: str
    temperature: Optional[float] = None
    num_ctx: Optional[int] = None
    num_gpu: Optional[int] = None
    num_batch: Optional[int] = None
    top_p: Optional[float] = None
    top_k: Optional[int] = None
    repeat_penalty: Optional[float] = None
    stream: bool = False
    keep_alive: Optional[Union[int, str]] = None


@dataclass 
class ChatMessage:
    """Chat message structure"""
    role: str  # 'user', 'assistant', 'system'
    content: str


class OllamaClient:
    """
    Production-ready Ollama client with streaming support and robust error handling.
    """
    
    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: float = 60.0,
        max_retries: int = 2,
        retry_delay: float = 1.0
    ):
        self.base_url = base_url or getattr(settings, 'OLLAMA_BASE_URL', getattr(settings, 'OLLAMA_URL', 'http://localhost:11434'))
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        # Remove trailing slash
        if self.base_url.endswith('/'):
            self.base_url = self.base_url[:-1]
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[Dict] = None,
        stream: bool = False,
        timeout: Optional[float] = None
    ) -> Union[Dict, AsyncGenerator[Dict, None]]:
        """
        Make HTTP request with retries and error handling.
        """
        url = f"{self.base_url}{endpoint}"
        request_timeout = timeout or self.timeout
        
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                async with AsyncClient(timeout=request_timeout) as client:
                    if stream:
                        return self._stream_request(client, method, url, json_data)
                    else:
                        response = await client.request(method, url, json=json_data)
                        return await self._handle_response(response)
                        
            except (ConnectError, TimeoutException) as e:
                last_exception = e
                if attempt < self.max_retries:
                    delay = self.retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Request failed (attempt {attempt + 1}), retrying in {delay}s: {e}")
                    await asyncio.sleep(delay)
                    continue
                else:
                    raise TransportError(f"Connection failed after {self.max_retries + 1} attempts: {e}")
            
            except Exception as e:
                logger.error(f"Unexpected error in request: {e}")
                raise TransportError(f"Unexpected error: {e}")
        
        # This should never be reached, but just in case
        if last_exception:
            raise TransportError(f"Request failed: {last_exception}")
    
    async def _stream_request(
        self, 
        client: AsyncClient, 
        method: str, 
        url: str, 
        json_data: Optional[Dict]
    ) -> AsyncGenerator[Dict, None]:
        """Handle streaming requests"""
        try:
            async with client.stream(method, url, json=json_data) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise await self._handle_error_response(response.status_code, error_text.decode())
                
                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    
                    # Process complete JSON lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()
                        
                        if not line:
                            continue
                            
                        try:
                            data = json.loads(line)
                            yield data
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse streaming JSON: {line} - {e}")
                            continue
                
                # Process any remaining buffer
                if buffer.strip():
                    try:
                        data = json.loads(buffer.strip())
                        yield data
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse final buffer: {buffer}")
                        
        except httpx.TimeoutException:
            raise StreamingError("Stream timed out")
        except httpx.ConnectError as e:
            raise TransportError(f"Connection error during streaming: {e}")
    
    async def _handle_response(self, response: httpx.Response) -> Dict:
        """Handle non-streaming responses"""
        if response.status_code == 200:
            try:
                return response.json()
            except json.JSONDecodeError as e:
                raise ValidationError(f"Invalid JSON response: {e}")
        else:
            raise await self._handle_error_response(response.status_code, response.text)
    
    async def _handle_error_response(self, status_code: int, response_text: str) -> Exception:
        """Map HTTP errors to appropriate exception types"""
        try:
            error_data = json.loads(response_text)
            error_msg = error_data.get('error', 'Unknown error')
        except json.JSONDecodeError:
            error_msg = response_text or f"HTTP {status_code}"
        
        if status_code == 404:
            if 'model' in error_msg.lower():
                return ModelError(f"Model not found: {error_msg}")
            return ValidationError(f"Endpoint not found: {error_msg}")
        elif status_code == 400:
            return ValidationError(f"Bad request: {error_msg}")
        elif 500 <= status_code < 600:
            return TransportError(f"Server error: {error_msg}")
        else:
            return TransportError(f"HTTP {status_code}: {error_msg}")
    
    def _build_options_dict(self, opts: GenerateOptions) -> Dict[str, Any]:
        """Build options dictionary for API requests"""
        options = {}
        
        if opts.temperature is not None:
            options['temperature'] = opts.temperature
        if opts.num_ctx is not None:
            options['num_ctx'] = opts.num_ctx
        if opts.num_gpu is not None:
            options['num_gpu'] = opts.num_gpu
        if opts.num_batch is not None:
            options['num_batch'] = opts.num_batch
        if opts.top_p is not None:
            options['top_p'] = opts.top_p
        if opts.top_k is not None:
            options['top_k'] = opts.top_k
        if opts.repeat_penalty is not None:
            options['repeat_penalty'] = opts.repeat_penalty
            
        return options
    
    async def generate(self, opts: GenerateOptions, prompt: str) -> Union[Dict, AsyncGenerator[StreamChunk, None]]:
        """
        Generate text completion using Ollama.
        
        Args:
            opts: Generation options
            prompt: Input prompt text
            
        Returns:
            Dict for non-streaming, AsyncGenerator[StreamChunk] for streaming
        """
        if not prompt.strip():
            raise ValidationError("Prompt cannot be empty")
        
        request_data = {
            'model': opts.model,
            'prompt': prompt,
            'stream': opts.stream,
            'options': self._build_options_dict(opts)
        }
        
        if opts.keep_alive is not None:
            request_data['keep_alive'] = opts.keep_alive
        
        if opts.stream:
            return self._stream_generate(request_data)
        else:
            response = await self._make_request('POST', '/api/generate', request_data)
            return response
    
    async def _stream_generate(self, request_data: Dict) -> AsyncGenerator[StreamChunk, None]:
        """Handle streaming generate responses"""
        async for chunk_data in await self._make_request('POST', '/api/generate', request_data, stream=True):
            yield StreamChunk(
                content=chunk_data.get('response', ''),
                done=chunk_data.get('done', False),
                model=chunk_data.get('model'),
                created_at=chunk_data.get('created_at'),
                response=chunk_data.get('response'),
                context=chunk_data.get('context')
            )
    
    async def chat(self, opts: GenerateOptions, messages: List[ChatMessage]) -> Union[Dict, AsyncGenerator[StreamChunk, None]]:
        """
        Generate chat completion using Ollama.
        
        Args:
            opts: Generation options  
            messages: List of chat messages
            
        Returns:
            Dict for non-streaming, AsyncGenerator[StreamChunk] for streaming
        """
        if not messages:
            raise ValidationError("Messages cannot be empty")
        
        # Convert ChatMessage objects to dicts
        message_dicts = []
        for msg in messages:
            if not isinstance(msg, ChatMessage):
                raise ValidationError("All messages must be ChatMessage instances")
            if msg.role not in ['user', 'assistant', 'system']:
                raise ValidationError(f"Invalid message role: {msg.role}")
            message_dicts.append({'role': msg.role, 'content': msg.content})
        
        request_data = {
            'model': opts.model,
            'messages': message_dicts,
            'stream': opts.stream,
            'options': self._build_options_dict(opts)
        }
        
        if opts.keep_alive is not None:
            request_data['keep_alive'] = opts.keep_alive
        
        if opts.stream:
            return self._stream_chat(request_data)
        else:
            response = await self._make_request('POST', '/api/chat', request_data)
            return response
    
    async def _stream_chat(self, request_data: Dict) -> AsyncGenerator[StreamChunk, None]:
        """Handle streaming chat responses"""
        async for chunk_data in await self._make_request('POST', '/api/chat', request_data, stream=True):
            message = chunk_data.get('message', {})
            yield StreamChunk(
                content=message.get('content', ''),
                done=chunk_data.get('done', False),
                model=chunk_data.get('model'),
                created_at=chunk_data.get('created_at')
            )
    
    async def embed(self, model: str, texts: List[str]) -> Dict[str, Any]:
        """
        Generate embeddings for text(s).
        
        Args:
            model: Embedding model name
            texts: List of texts to embed
            
        Returns:
            Dict with embeddings array
        """
        if not texts:
            raise ValidationError("Texts cannot be empty")
        
        if not model.strip():
            raise ValidationError("Model name cannot be empty")
        
        # For single text, Ollama expects a string. For multiple, use list.
        input_data = texts[0] if len(texts) == 1 else texts
        
        request_data = {
            'model': model,
            'input': input_data
        }
        
        response = await self._make_request('POST', '/api/embed', request_data)
        return response
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models"""
        try:
            response = await self._make_request('GET', '/api/tags')
            return response.get('models', [])
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    async def show_model(self, model: str) -> Optional[Dict[str, Any]]:
        """Get model information"""
        try:
            request_data = {'name': model}
            response = await self._make_request('POST', '/api/show', request_data)
            return response
        except ModelError:
            return None
        except Exception as e:
            logger.error(f"Failed to get model info for {model}: {e}")
            return None
    
    async def pull_model(self, model: str) -> Dict[str, Any]:
        """Pull/download a model"""
        request_data = {'name': model}
        
        try:
            # Use longer timeout for model downloads
            response = await self._make_request('POST', '/api/pull', request_data, timeout=300.0)
            return {'success': True, 'model': model}
        except Exception as e:
            logger.error(f"Failed to pull model {model}: {e}")
            return {'success': False, 'error': str(e)}
    
    async def delete_model(self, model: str) -> Dict[str, Any]:
        """Delete a model"""
        request_data = {'name': model}
        
        try:
            await self._make_request('DELETE', '/api/delete', request_data)
            return {'success': True, 'model': model}
        except Exception as e:
            logger.error(f"Failed to delete model {model}: {e}")
            return {'success': False, 'error': str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Ollama health and available models"""
        try:
            models = await self.list_models()
            return {
                'connected': True,
                'status': 'online',
                'models': models,
                'model_count': len(models)
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'connected': False,
                'status': 'offline',
                'error': str(e),
                'models': [],
                'model_count': 0
            }


# Global client instance
_ollama_client: Optional[OllamaClient] = None


def get_ollama_client() -> OllamaClient:
    """Get global Ollama client instance"""
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client