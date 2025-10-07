"""
MCP (Model Context Protocol) service for handling server connections.
"""
import asyncio
import json
import time
from typing import Tuple, Optional, Dict, Any
from cryptography.fernet import Fernet
import httpx
from loguru import logger

from app.core.config import get_settings
from app.db.models import McpServer

settings = get_settings()


class MCPService:
    """Service for managing MCP server connections."""
    
    def __init__(self):
        # Generate a key for encryption (in production, use a proper key management system)
        self.encryption_key = Fernet.generate_key()
        self.cipher = Fernet(self.encryption_key)
        self.active_connections: Dict[str, Any] = {}
    
    async def encrypt_credentials(self, credentials: dict) -> str:
        """Encrypt credentials for storage."""
        credentials_json = json.dumps(credentials)
        encrypted = self.cipher.encrypt(credentials_json.encode())
        return encrypted.decode()
    
    async def decrypt_credentials(self, encrypted_credentials: str) -> dict:
        """Decrypt credentials."""
        try:
            decrypted = self.cipher.decrypt(encrypted_credentials.encode())
            return json.loads(decrypted.decode())
        except Exception as e:
            logger.error(f"Failed to decrypt credentials: {e}")
            return {}
    
    async def test_connection(self, server: McpServer) -> Tuple[bool, str]:
        """Test connection to MCP server."""
        try:
            # Validate URL format
            if not server.url or not server.url.strip():
                return False, "Server URL is empty"
            
            url = server.url.strip()
            if not url.startswith(('http://', 'https://')):
                return False, "Request URL is missing an 'http://' or 'https://' protocol."
            
            headers = {"Content-Type": "application/json"}
            
            # Add authentication if required
            if server.auth_method == "api_key" and server.credentials:
                credentials = await self.decrypt_credentials(server.credentials)
                api_key = credentials.get("api_key")
                if api_key:
                    headers["Authorization"] = f"Bearer {api_key}"
            
            async with httpx.AsyncClient(
                timeout=server.timeout,
                verify=server.ssl_verify
            ) as client:
                # Try a basic health check or ping endpoint
                response = await client.get(
                    f"{server.url}/health",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return True, "Connection successful"
                else:
                    return False, f"Server returned status {response.status_code}"
                    
        except httpx.TimeoutException:
            return False, "Connection timeout"
        except httpx.ConnectError:
            return False, "Could not connect to server"
        except Exception as e:
            return False, f"Connection error: {str(e)}"
    
    async def ping_server(self, server: McpServer) -> Tuple[bool, Optional[int]]:
        """Ping server and measure latency."""
        try:
            start_time = time.time()
            success, _ = await self.test_connection(server)
            end_time = time.time()
            
            if success:
                latency_ms = int((end_time - start_time) * 1000)
                return True, latency_ms
            else:
                return False, None
                
        except Exception as e:
            logger.error(f"Failed to ping server {server.name}: {e}")
            return False, None
    
    async def test_connection_async(self, server: McpServer):
        """Test connection asynchronously (fire and forget)."""
        try:
            success, message = await self.test_connection(server)
            # Update server status in database
            from app.db.database import async_engine
            from sqlalchemy.ext.asyncio import AsyncSession
            from datetime import datetime
            
            async with AsyncSession(async_engine) as session:
                server.status = "online" if success else "offline"
                server.last_checked = datetime.utcnow()
                session.add(server)
                await session.commit()
                
        except Exception as e:
            logger.error(f"Failed to test connection for server {server.name}: {e}")
    
    async def create_websocket_connection(self, server: McpServer, user_id: str):
        """Create WebSocket connection to MCP server."""
        try:
            # This would implement the actual MCP protocol connection
            # For now, we'll simulate it
            connection_id = f"{server.id}:{user_id}"
            
            # Store connection info
            self.active_connections[connection_id] = {
                "server": server,
                "user_id": user_id,
                "connected_at": time.time(),
                "status": "connected"
            }
            
            logger.info(f"Created WebSocket connection for server {server.name}")
            return connection_id
            
        except Exception as e:
            logger.error(f"Failed to create WebSocket connection: {e}")
            raise
    
    async def close_websocket_connection(self, connection_id: str):
        """Close WebSocket connection."""
        try:
            if connection_id in self.active_connections:
                del self.active_connections[connection_id]
                logger.info(f"Closed WebSocket connection {connection_id}")
        except Exception as e:
            logger.error(f"Failed to close WebSocket connection: {e}")
    
    async def send_message_to_server(self, connection_id: str, message: dict) -> dict:
        """Send message to MCP server via WebSocket."""
        try:
            if connection_id not in self.active_connections:
                raise ValueError("Connection not found")
            
            # Simulate message processing
            # In a real implementation, this would send the message to the actual MCP server
            
            # Echo back a response for demonstration
            if message.get("type") == "chat_message":
                return {
                    "type": "chat_message",
                    "payload": {
                        "sender": "AGENT",
                        "text": f"I received your message: {message['payload']['text']}",
                        "timestamp": "2025-10-02T22:30:05Z"
                    }
                }
            elif message.get("type") == "approve_task":
                return {
                    "type": "task_approved",
                    "payload": {
                        "node_id": message["payload"]["node_id"],
                        "status": "approved"
                    }
                }
            else:
                return {
                    "type": "error",
                    "payload": {
                        "message": "Unknown message type"
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to send message to server: {e}")
            return {
                "type": "error",
                "payload": {
                    "message": str(e)
                }
            }