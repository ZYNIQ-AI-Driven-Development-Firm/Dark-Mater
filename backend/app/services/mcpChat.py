"""
MCP Chat service with per-server memory and Redis caching.
"""
import json
import logging
from typing import Dict, List, Optional, Any, AsyncGenerator
from uuid import UUID

import redis.asyncio as redis

from app.core.config import get_settings
from app.clients.mcpMemoryClient import get_mcp_memory_client
from app.llm.ollamaClient import get_ollama_client, GenerateOptions, ChatMessage, StreamChunk

logger = logging.getLogger(__name__)
settings = get_settings()


class McpChatService:
    """Service for MCP server-specific chat with distributed memory."""

    def __init__(self):
        self.ollama_client = get_ollama_client()
        self.mcp_memory_client = get_mcp_memory_client()
        self.mcp_model = settings.MCP_MODEL
        self.system_prompt_template = settings.MCP_SYSTEM_PROMPT
        self.history_limit = settings.MCP_CHAT_HISTORY_LIMIT
        
        # Redis connection for caching recent conversations
        self.redis_client = None
        self._redis_url = settings.REDIS_URL

    async def _get_redis(self) -> redis.Redis:
        """Get Redis client, creating connection if needed."""
        if self.redis_client is None:
            self.redis_client = redis.from_url(
                self._redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self.redis_client

    def _get_redis_key(self, server_id: str, thread_id: str) -> str:
        """Generate Redis key for MCP chat cache."""
        return f"mcpchat:{server_id}:{thread_id}"

    async def _get_cached_messages(
        self, 
        server_id: str, 
        thread_id: str
    ) -> List[Dict[str, Any]]:
        """Get cached messages from Redis."""
        try:
            redis_client = await self._get_redis()
            key = self._get_redis_key(server_id, thread_id)
            
            cached_data = await redis_client.get(key)
            if cached_data:
                messages = json.loads(cached_data)
                return messages[-self.history_limit:]  # Keep only recent messages
            
        except Exception as e:
            logger.warning(f"Failed to get cached messages: {e}")
            
        return []

    async def _cache_messages(
        self, 
        server_id: str, 
        thread_id: str, 
        messages: List[Dict[str, Any]]
    ) -> None:
        """Cache messages to Redis."""
        try:
            redis_client = await self._get_redis()
            key = self._get_redis_key(server_id, thread_id)
            
            # Keep only the most recent messages
            recent_messages = messages[-self.history_limit:]
            
            await redis_client.setex(
                key,
                3600,  # 1 hour TTL
                json.dumps(recent_messages, default=str)
            )
            
        except Exception as e:
            logger.warning(f"Failed to cache messages: {e}")

    async def send_mcp_message(
        self,
        server_id: str,
        thread_id: str,
        text: str,
        mcp_base_url: str,
        server_name: str,
        auth_token: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Send message to MCP chat and stream response.
        
        Args:
            server_id: MCP server ID
            thread_id: Chat thread ID
            text: User message text
            mcp_base_url: Base URL of the MCP server
            server_name: Human-readable server name
            auth_token: Optional authentication token
            
        Yields:
            Streaming response tokens
        """
        if not text.strip():
            raise ValueError("Message text cannot be empty")

        # Get cached conversation history
        cached_messages = await self._get_cached_messages(server_id, thread_id)

        # Retrieve memory snippets from MCP server
        memory_snippets = await self.mcp_memory_client.retrieve_memory(
            server_url=mcp_base_url,
            server_id=server_id,
            thread_id=thread_id,
            query=text,
            limit=5,
            auth_token=auth_token
        )

        # Build messages for Ollama
        messages = []

        # System message with server-specific prompt
        system_prompt = self.system_prompt_template.format(server_name=server_name)
        messages.append(ChatMessage(role="system", content=system_prompt))

        # Add memory context if available
        if memory_snippets:
            context_parts = ["Relevant server memory and context:"]
            for i, snippet in enumerate(memory_snippets, 1):
                if isinstance(snippet, str):
                    context_parts.append(f"{i}. {snippet}")
                elif isinstance(snippet, dict):
                    content = snippet.get('content', snippet.get('text', str(snippet)))
                    if snippet.get('source'):
                        content += f" [Source: {snippet['source']}]"
                    context_parts.append(f"{i}. {content}")
                else:
                    context_parts.append(f"{i}. {str(snippet)}")

            context_content = "\n".join(context_parts)
            messages.append(ChatMessage(role="system", content=context_content))

        # Add cached conversation history
        for msg in cached_messages:
            messages.append(ChatMessage(role=msg["role"], content=msg["content"]))

        # Add current user message
        messages.append(ChatMessage(role="user", content=text))

        # Generate streaming response
        generate_opts = GenerateOptions(
            model=self.mcp_model,
            temperature=0.2,
            num_ctx=768,
            num_gpu=0,  # Force CPU for MCP chat
            keep_alive=0,
            stream=True
        )

        assistant_content = ""
        token_count = 0

        try:
            stream = await self.ollama_client.chat(generate_opts, messages)

            async for chunk in stream:
                if chunk.content:
                    assistant_content += chunk.content
                    token_count += 1
                    yield chunk.content

                if chunk.done:
                    break

        except Exception as e:
            logger.error(f"Ollama MCP chat failed: {e}")
            error_content = f"Error: {str(e)}"
            assistant_content = error_content
            yield error_content

        # Update cached messages with new conversation turn
        new_messages = cached_messages + [
            {
                "role": "user",
                "content": text,
                "timestamp": "now"
            },
            {
                "role": "assistant", 
                "content": assistant_content,
                "model_used": self.mcp_model,
                "token_count": token_count,
                "timestamp": "now"
            }
        ]

        await self._cache_messages(server_id, thread_id, new_messages)

        # Store conversation in MCP server memory
        success = await self.mcp_memory_client.append_memory(
            server_url=mcp_base_url,
            server_id=server_id,
            thread_id=thread_id,
            user_message=text,
            assistant_message=assistant_content,
            auth_token=auth_token,
            metadata={
                "model_used": self.mcp_model,
                "token_count": token_count,
                "memory_snippets_count": len(memory_snippets)
            }
        )

        if not success:
            logger.warning(f"Failed to append memory to MCP server {server_id}")

    async def get_mcp_messages(
        self,
        server_id: str,
        thread_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get cached MCP chat messages.
        
        Args:
            server_id: MCP server ID
            thread_id: Chat thread ID
            
        Returns:
            List of cached messages
        """
        return await self._get_cached_messages(server_id, thread_id)

    async def clear_mcp_thread(
        self,
        server_id: str,
        thread_id: str
    ) -> bool:
        """
        Clear cached messages for an MCP thread.
        
        Args:
            server_id: MCP server ID
            thread_id: Chat thread ID
            
        Returns:
            True if successful
        """
        try:
            redis_client = await self._get_redis()
            key = self._get_redis_key(server_id, thread_id)
            
            await redis_client.delete(key)
            logger.info(f"Cleared MCP thread cache: {server_id}/{thread_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear MCP thread cache: {e}")
            return False

    async def health_check(self) -> Dict[str, Any]:
        """Check MCP chat service health."""
        health = {
            "service": "mcp_chat",
            "status": "healthy",
            "redis_connected": False,
            "ollama_connected": False
        }

        # Check Redis connection
        try:
            redis_client = await self._get_redis()
            await redis_client.ping()
            health["redis_connected"] = True
        except Exception as e:
            health["redis_connected"] = False
            health["redis_error"] = str(e)

        # Check Ollama connection
        try:
            ollama_health = await self.ollama_client.health_check()
            health["ollama_connected"] = ollama_health.get("connected", False)
            if not health["ollama_connected"]:
                health["ollama_error"] = ollama_health.get("error", "Unknown error")
        except Exception as e:
            health["ollama_connected"] = False
            health["ollama_error"] = str(e)

        # Overall status
        if not health["redis_connected"] or not health["ollama_connected"]:
            health["status"] = "degraded"

        return health

    async def close(self):
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()


# Global service instance
_mcp_chat_service: Optional[McpChatService] = None


def get_mcp_chat_service() -> McpChatService:
    """Get global MCP Chat service instance"""
    global _mcp_chat_service
    if _mcp_chat_service is None:
        _mcp_chat_service = McpChatService()
    return _mcp_chat_service