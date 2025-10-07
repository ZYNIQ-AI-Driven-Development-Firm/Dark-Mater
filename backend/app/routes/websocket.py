"""
WebSocket routes for real-time MCP server communication.
"""
import json
from typing import Dict, Any
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from loguru import logger
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_async_session
from app.auth.jwt import JWTHandler
from app.db.models import User, McpServer
from app.services.mcp import MCPService

router = APIRouter()
mcp_service = MCPService()


class ConnectionManager:
    """Manage WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str):
        """Accept WebSocket connection."""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info(f"WebSocket connected: {connection_id}")
    
    def disconnect(self, connection_id: str):
        """Remove WebSocket connection."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
            logger.info(f"WebSocket disconnected: {connection_id}")
    
    async def send_personal_message(self, message: dict, connection_id: str):
        """Send message to specific connection."""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to {connection_id}: {e}")
                self.disconnect(connection_id)


manager = ConnectionManager()


async def get_user_from_token(token: str, session: AsyncSession) -> User:
    """Get user from JWT token."""
    payload = JWTHandler.decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = UUID(payload.get("sub"))
    statement = select(User).where(User.id == user_id, User.is_active == True)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


@router.websocket("/server/{server_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    server_id: UUID,
    token: str = Query(...),
):
    """WebSocket endpoint for MCP server communication."""
    connection_id = None
    
    try:
        # Get async session
        from app.db.database import async_engine
        async with AsyncSession(async_engine) as session:
            # Authenticate user
            user = await get_user_from_token(token, session)
            
            # Get server
            statement = select(McpServer).where(
                McpServer.id == server_id,
                McpServer.owner_id == user.id
            )
            result = await session.execute(statement)
            server = result.scalar_one_or_none()
            
            if not server:
                await websocket.close(code=1008, reason="Server not found")
                return
            
            # Create MCP connection
            connection_id = await mcp_service.create_websocket_connection(server, str(user.id))
            ws_connection_id = f"ws:{connection_id}"
            
            # Accept WebSocket connection
            await manager.connect(websocket, ws_connection_id)
            
            # Send initial connection status
            await manager.send_personal_message({
                "type": "connection_status",
                "payload": {
                    "status": "online",
                    "server_name": server.name,
                    "connected_at": "2025-10-02T22:30:05Z"
                }
            }, ws_connection_id)
            
            # Message handling loop
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    
                    # Validate message structure
                    if not isinstance(message, dict) or "type" not in message:
                        await manager.send_personal_message({
                            "type": "error",
                            "payload": {"message": "Invalid message format"}
                        }, ws_connection_id)
                        continue
                    
                    # Process message through MCP service
                    response = await mcp_service.send_message_to_server(connection_id, message)
                    
                    # Send response back to client
                    await manager.send_personal_message(response, ws_connection_id)
                    
                    # Log the interaction
                    await manager.send_personal_message({
                        "type": "log_entry",
                        "payload": {
                            "timestamp": "2025-10-02T22:30:05Z",
                            "level": "info",
                            "message": f"Processed {message['type']} message"
                        }
                    }, ws_connection_id)
                    
                except json.JSONDecodeError:
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Invalid JSON format"}
                    }, ws_connection_id)
                    
                except Exception as e:
                    logger.error(f"Error processing WebSocket message: {e}")
                    await manager.send_personal_message({
                        "type": "error",
                        "payload": {"message": "Internal server error"}
                    }, ws_connection_id)
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {server_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass
    
    finally:
        # Cleanup
        if connection_id:
            ws_connection_id = f"ws:{connection_id}"
            manager.disconnect(ws_connection_id)
            await mcp_service.close_websocket_connection(connection_id)