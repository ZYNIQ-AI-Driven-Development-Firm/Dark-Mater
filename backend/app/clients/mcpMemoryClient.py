"""
MCP Memory Client for interacting with MCP server memory APIs.
"""
import logging
from typing import Dict, List, Optional, Any
import httpx
from httpx import AsyncClient, TimeoutException, ConnectError

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class McpMemoryError(Exception):
    """MCP Memory API related errors"""
    pass


class McpMemoryClient:
    """
    Client for interacting with MCP server memory APIs.
    
    Each MCP server is expected to implement these endpoints:
    - GET /memory/retrieve?server_id=...&thread_id=...&q=... -> returns memory snippets
    - POST /memory/append -> stores new conversation turns
    """
    
    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout
    
    async def retrieve_memory(
        self,
        server_url: str,
        server_id: str,
        thread_id: str,
        query: str,
        limit: int = 5,
        auth_token: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve memory snippets from an MCP server.
        
        Args:
            server_url: Base URL of the MCP server
            server_id: Server identifier
            thread_id: Chat thread identifier
            query: Search query for relevant memories
            limit: Maximum number of snippets to return
            auth_token: Optional authentication token
            
        Returns:
            List of memory snippets with metadata
        """
        if not server_url.startswith(('http://', 'https://')):
            raise McpMemoryError(f"Invalid server URL: {server_url}")
        
        # Clean server URL
        server_url = server_url.rstrip('/')
        url = f"{server_url}/memory/retrieve"
        
        params = {
            'server_id': server_id,
            'thread_id': thread_id,
            'q': query,
            'limit': limit
        }
        
        headers = {}
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        try:
            async with AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    # Normalize response format
                    if isinstance(data, list):
                        return data
                    elif isinstance(data, dict) and 'snippets' in data:
                        return data['snippets']
                    elif isinstance(data, dict) and 'memories' in data:
                        return data['memories']
                    else:
                        logger.warning(f"Unexpected memory response format from {server_url}: {data}")
                        return []
                        
                elif response.status_code == 404:
                    # Server doesn't implement memory API - that's ok
                    logger.info(f"MCP server {server_url} doesn't implement memory API")
                    return []
                    
                else:
                    error_msg = f"Memory retrieval failed with HTTP {response.status_code}"
                    try:
                        error_data = response.json()
                        if 'error' in error_data:
                            error_msg += f": {error_data['error']}"
                    except:
                        pass
                    
                    logger.error(f"Memory retrieval error from {server_url}: {error_msg}")
                    return []  # Fail gracefully
                    
        except (ConnectError, TimeoutException) as e:
            logger.warning(f"Failed to connect to MCP server {server_url} for memory retrieval: {e}")
            return []  # Fail gracefully - chat can work without memory
            
        except Exception as e:
            logger.error(f"Unexpected error retrieving memory from {server_url}: {e}")
            return []  # Fail gracefully
    
    async def append_memory(
        self,
        server_url: str,
        server_id: str,
        thread_id: str,
        user_message: str,
        assistant_message: str,
        auth_token: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Append conversation turns to MCP server memory.
        
        Args:
            server_url: Base URL of the MCP server
            server_id: Server identifier  
            thread_id: Chat thread identifier
            user_message: User's message content
            assistant_message: Assistant's response content
            auth_token: Optional authentication token
            metadata: Optional metadata about the conversation
            
        Returns:
            True if successful, False otherwise
        """
        if not server_url.startswith(('http://', 'https://')):
            logger.error(f"Invalid server URL: {server_url}")
            return False
        
        # Clean server URL
        server_url = server_url.rstrip('/')
        url = f"{server_url}/memory/append"
        
        payload = {
            'server_id': server_id,
            'thread_id': thread_id,
            'user_message': user_message,
            'assistant_message': assistant_message
        }
        
        if metadata:
            payload['metadata'] = metadata
        
        headers = {'Content-Type': 'application/json'}
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        try:
            async with AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code in (200, 201):
                    return True
                elif response.status_code == 404:
                    # Server doesn't implement memory API - that's ok
                    logger.info(f"MCP server {server_url} doesn't implement memory append API")
                    return True  # Don't consider this a failure
                else:
                    error_msg = f"Memory append failed with HTTP {response.status_code}"
                    try:
                        error_data = response.json()
                        if 'error' in error_data:
                            error_msg += f": {error_data['error']}"
                    except:
                        pass
                    
                    logger.error(f"Memory append error to {server_url}: {error_msg}")
                    return False
                    
        except (ConnectError, TimeoutException) as e:
            logger.warning(f"Failed to connect to MCP server {server_url} for memory append: {e}")
            return False
            
        except Exception as e:
            logger.error(f"Unexpected error appending memory to {server_url}: {e}")
            return False
    
    async def health_check(
        self,
        server_url: str,
        auth_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check if MCP server memory API is available.
        
        Returns:
            Dict with 'available' boolean and optional 'features' list
        """
        if not server_url.startswith(('http://', 'https://')):
            return {'available': False, 'error': 'Invalid URL'}
        
        server_url = server_url.rstrip('/')
        url = f"{server_url}/memory/status"
        
        headers = {}
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        try:
            async with AsyncClient(timeout=5.0) as client:  # Short timeout for health check
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'available': True,
                        'features': data.get('features', ['retrieve', 'append'])
                    }
                else:
                    return {'available': False, 'status_code': response.status_code}
                    
        except Exception as e:
            return {'available': False, 'error': str(e)}


# Global client instance
_mcp_memory_client: Optional[McpMemoryClient] = None


def get_mcp_memory_client() -> McpMemoryClient:
    """Get global MCP memory client instance"""
    global _mcp_memory_client
    if _mcp_memory_client is None:
        _mcp_memory_client = McpMemoryClient()
    return _mcp_memory_client