"""
Company Chat API routes.
"""
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_active_user
from app.db.models import User
from app.services.companyChat import get_company_chat_service

logger = logging.getLogger(__name__)
router = APIRouter()
company_chat_service = get_company_chat_service()


# Request/Response schemas
class CreateThreadRequest(BaseModel):
    """Request to create a new company chat thread."""
    title: Optional[str] = Field(None, max_length=200)


class CreateThreadResponse(BaseModel):
    """Response for thread creation."""
    id: str
    title: Optional[str]
    created_at: str


class SendMessageRequest(BaseModel):
    """Request to send a message in company chat."""
    text: str = Field(..., min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    """Company chat message response."""
    id: str
    role: str
    content: str
    model_used: Optional[str]
    token_count: Optional[int]
    created_at: str


class SummarizeThreadResponse(BaseModel):
    """Thread summarization response."""
    summary: str
    message_count: int


@router.post("/threads", response_model=CreateThreadResponse)
async def create_company_thread(
    request: CreateThreadRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new company chat thread."""
    try:
        thread_id = await company_chat_service.create_thread(
            user_id=current_user.id,
            title=request.title
        )
        
        return CreateThreadResponse(
            id=str(thread_id),
            title=request.title,
            created_at="now"  # Would be actual timestamp in real implementation
        )
        
    except Exception as e:
        logger.error(f"Failed to create company thread: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create thread"
        )


@router.get("/threads/{thread_id}/messages")
async def get_company_messages(
    thread_id: UUID,
    limit: Optional[int] = 50,
    current_user: User = Depends(get_current_active_user)
):
    """Get messages from a company chat thread."""
    try:
        messages = await company_chat_service.get_messages(thread_id, limit)
        return {"messages": messages}
        
    except Exception as e:
        logger.error(f"Failed to get company messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages"
        )


@router.post("/threads/{thread_id}/messages")
async def send_company_message(
    thread_id: UUID,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Send a message in company chat (streaming response)."""
    
    async def generate():
        try:
            async for token in company_chat_service.send_company_message(
                thread_id=thread_id,
                user_id=current_user.id,
                text=request.text
            ):
                yield token
                
        except ValueError as e:
            yield f"Error: {str(e)}"
        except Exception as e:
            logger.error(f"Company chat streaming failed: {e}")
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


@router.post("/threads/{thread_id}/summarize", response_model=SummarizeThreadResponse)
async def summarize_company_thread(
    thread_id: UUID,
    current_user: User = Depends(get_current_active_user)
):
    """Summarize a company chat thread for compaction."""
    try:
        summary = await company_chat_service.summarize_thread(
            thread_id=thread_id,
            user_id=current_user.id
        )
        
        # Get message count for response
        messages = await company_chat_service.get_messages(thread_id)
        
        return SummarizeThreadResponse(
            summary=summary,
            message_count=len(messages) 
        )
        
    except Exception as e:
        logger.error(f"Failed to summarize thread: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to summarize thread"
        )