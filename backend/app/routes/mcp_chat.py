"""
MCP Chat API routes.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_active_user
from app.db.models import User
from app.services.mcpChat import get_mcp_chat_service

logger = logging.getLogger(__name__)
router = APIRouter()
mcp_chat_service = get_mcp_chat_service()


# Request/Response schemas
class SendMcpMessageRequest(BaseModel):
    """Request to send a message in MCP chat."""
    text: str = Field(..., min_length=1, max_length=4000)
    mcp_base_url: str = Field(..., min_length=1)
    server_name: str = Field(..., min_length=1, max_length=100)
    auth_token: Optional[str] = None


class McpMessageResponse(BaseModel):
    """MCP chat message response."""
    role: str
    content: str
    model_used: Optional[str]
    token_count: Optional[int]
    timestamp: str


@router.post("/{server_id}/threads/{thread_id}/messages")
async def send_mcp_message(
    server_id: str,
    thread_id: str,
    request: SendMcpMessageRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Send a message in MCP chat (streaming response)."""
    
    # Validate server_id format (prevent path traversal)
    if not server_id.replace('-', '').replace('_', '').isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid server ID format"
        )
    
    # Validate thread_id format 
    if not thread_id.replace('-', '').replace('_', '').isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid thread ID format"
        )
    
    async def generate():
        try:
            async for token in mcp_chat_service.send_mcp_message(
                server_id=server_id,
                thread_id=thread_id,
                text=request.text,
                mcp_base_url=request.mcp_base_url,
                server_name=request.server_name,
                auth_token=request.auth_token
            ):
                yield token
                
        except ValueError as e:
            yield f"Error: {str(e)}"
        except Exception as e:
            logger.error(f"MCP chat streaming failed: {e}")
            yield f"Error: Internal server error"
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/{server_id}/threads/{thread_id}/messages")
async def get_mcp_messages(
    server_id: str,
    thread_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get cached messages from an MCP chat thread."""
    
    # Validate IDs
    if not server_id.replace('-', '').replace('_', '').isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid server ID format"
        )
    
    if not thread_id.replace('-', '').replace('_', '').isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid thread ID format"
        )
    
    try:
        messages = await mcp_chat_service.get_mcp_messages(server_id, thread_id)
        return {"messages": messages}
        
    except Exception as e:
        logger.error(f"Failed to get MCP messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages"
        )


@router.delete("/{server_id}/threads/{thread_id}")
async def clear_mcp_thread(
    server_id: str,
    thread_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Clear cached messages for an MCP thread."""
    
    # Validate IDs
    if not server_id.replace('-', '').replace('_', '').isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid server ID format"
        )
    
    if not thread_id.replace('-', '').replace('_', '').isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid thread ID format"
        )
    
    try:
        success = await mcp_chat_service.clear_mcp_thread(server_id, thread_id)
        
        if success:
            return {"message": "Thread cleared successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clear thread"
            )
            
    except Exception as e:
        logger.error(f"Failed to clear MCP thread: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear thread"
        )