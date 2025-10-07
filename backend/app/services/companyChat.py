"""
Company Chat service with RAG integration and PostgreSQL persistence.
"""
import json
import logging
from typing import Dict, List, Optional, Any, AsyncGenerator
from uuid import UUID, uuid4
from datetime import datetime

from sqlmodel import Session, select, text
from sqlalchemy import desc

from app.core.config import get_settings
from app.db.database import get_db_session
from app.db.models import User, CompanyChatThread, CompanyChatMessage, CompanyMemoryChunk
from app.llm.ollamaClient import get_ollama_client, GenerateOptions, ChatMessage, StreamChunk

logger = logging.getLogger(__name__)
settings = get_settings()


class CompanyChatService:
    """Service for company-wide chat with shared knowledge and RAG."""

    def __init__(self):
        self.ollama_client = get_ollama_client()
        self.company_model = settings.COMPANY_MODEL
        self.embed_model = settings.EMBED_MODEL
        self.system_prompt = settings.COMPANY_SYSTEM_PROMPT
        self.rag_enabled = settings.RAG_ENABLED
        self.rag_top_k = settings.RAG_TOP_K
        self.rag_min_similarity = settings.RAG_MIN_SIMILARITY
        self.history_limit = settings.COMPANY_CHAT_HISTORY_LIMIT

    async def create_thread(self, user_id: UUID, title: Optional[str] = None) -> UUID:
        """
        Create a new company chat thread.
        
        Args:
            user_id: ID of the user creating the thread
            title: Optional thread title
            
        Returns:
            UUID of the created thread
        """
        thread_id = uuid4()
        
        async with get_db_session() as session:
            thread = CompanyChatThread(
                id=thread_id,
                title=title,
                user_id=user_id
            )
            session.add(thread)
            await session.commit()
            
        logger.info(f"Created company chat thread {thread_id} for user {user_id}")
        return thread_id

    async def get_messages(
        self, 
        thread_id: UUID, 
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get messages from a company chat thread.
        
        Args:
            thread_id: Thread ID
            limit: Maximum number of messages to return
            
        Returns:
            List of message dictionaries
        """
        if limit is None:
            limit = self.history_limit
            
        async with get_db_session() as session:
            query = (
                select(CompanyChatMessage)
                .where(CompanyChatMessage.thread_id == thread_id)
                .order_by(desc(CompanyChatMessage.created_at))
                .limit(limit)
            )
            
            result = await session.exec(query)
            messages = result.all()
            
            # Reverse to get chronological order
            messages.reverse()
            
            return [
                {
                    "id": str(msg.id),
                    "role": msg.role,
                    "content": msg.content,
                    "model_used": msg.model_used,
                    "token_count": msg.token_count,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in messages
            ]

    async def _retrieve_rag_context(self, query: str) -> List[Dict[str, Any]]:
        """
        Retrieve relevant memory chunks using vector similarity.
        
        Args:
            query: Search query
            
        Returns:
            List of relevant memory chunks with metadata
        """
        if not self.rag_enabled:
            return []
            
        try:
            # Get embedding for the query
            embed_response = await self.ollama_client.embed(self.embed_model, [query])
            
            if 'embeddings' not in embed_response or not embed_response['embeddings']:
                logger.warning("Failed to get embedding for RAG query")
                return []
                
            query_embedding = embed_response['embeddings'][0]
            
            async with get_db_session() as session:
                # Use cosine similarity search
                sql_query = text("""
                    SELECT id, title, source, source_type, text, meta_data,
                           1 - (embedding <=> :query_embedding) as similarity
                    FROM company_memory_chunks
                    WHERE embedding IS NOT NULL
                      AND 1 - (embedding <=> :query_embedding) >= :min_similarity
                    ORDER BY similarity DESC
                    LIMIT :top_k
                """)
                
                result = await session.exec(
                    sql_query,
                    {
                        "query_embedding": json.dumps(query_embedding),
                        "min_similarity": self.rag_min_similarity,
                        "top_k": self.rag_top_k
                    }
                )
                
                chunks = result.all()
                
                return [
                    {
                        "id": str(chunk.id),
                        "title": chunk.title,
                        "source": chunk.source,
                        "source_type": chunk.source_type,
                        "text": chunk.text,
                        "similarity": chunk.similarity,
                        "metadata": json.loads(chunk.meta_data) if chunk.meta_data else {}
                    }
                    for chunk in chunks
                ]
                
        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}")
            return []

    def _build_rag_context_message(self, chunks: List[Dict[str, Any]]) -> str:
        """Build context message from retrieved chunks."""
        if not chunks:
            return ""
            
        context_parts = ["Here is relevant company knowledge to help answer the question:\n"]
        
        for i, chunk in enumerate(chunks, 1):
            source_info = f"[Source: {chunk['source']}]"
            context_parts.append(f"{i}. {chunk['title']} {source_info}")
            context_parts.append(f"   {chunk['text'][:500]}...")
            context_parts.append("")
            
        context_parts.append("Use this information to provide accurate, cited responses.")
        return "\n".join(context_parts)

    async def send_company_message(
        self,
        thread_id: UUID,
        user_id: UUID,
        text: str
    ) -> AsyncGenerator[str, None]:
        """
        Send message in company chat and stream response.
        
        Args:
            thread_id: Thread ID
            user_id: User ID
            text: User message text
            
        Yields:
            Streaming response tokens
        """
        if not text.strip():
            raise ValueError("Message text cannot be empty")
            
        # Get conversation history
        history = await self.get_messages(thread_id, self.history_limit - 1)
        
        # Retrieve RAG context
        rag_chunks = await self._retrieve_rag_context(text)
        
        # Build messages for Ollama
        messages = []
        
        # System message
        messages.append(ChatMessage(role="system", content=self.system_prompt))
        
        # RAG context message if available
        if rag_chunks:
            context_content = self._build_rag_context_message(rag_chunks)
            messages.append(ChatMessage(role="system", content=context_content))
        
        # Add conversation history
        for msg in history:
            messages.append(ChatMessage(role=msg["role"], content=msg["content"]))
            
        # Add current user message
        messages.append(ChatMessage(role="user", content=text))
        
        # Store user message
        user_message_id = uuid4()
        async with get_db_session() as session:
            user_msg = CompanyChatMessage(
                id=user_message_id,
                thread_id=thread_id,
                role="user",
                content=text
            )
            session.add(user_msg)
            await session.commit()
        
        # Generate streaming response
        generate_opts = GenerateOptions(
            model=self.company_model,
            temperature=0.4,
            num_ctx=1024,
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
            logger.error(f"Ollama chat failed: {e}")
            error_content = f"Error: {str(e)}"
            assistant_content = error_content
            yield error_content
        
        # Store assistant response
        async with get_db_session() as session:
            assistant_msg = CompanyChatMessage(
                id=uuid4(),
                thread_id=thread_id,
                role="assistant",
                content=assistant_content,
                model_used=self.company_model,
                token_count=token_count
            )
            session.add(assistant_msg)
            await session.commit()
            
        # Update thread timestamp
        async with get_db_session() as session:
            thread = await session.get(CompanyChatThread, thread_id)
            if thread:
                thread.updated_at = datetime.utcnow()
                await session.commit()

    async def summarize_thread(self, thread_id: UUID, user_id: UUID) -> str:
        """
        Summarize a thread for compaction (periodic history cleanup).
        
        Args:
            thread_id: Thread ID to summarize
            user_id: User ID requesting summarization
            
        Returns:
            Summary text
        """
        messages = await self.get_messages(thread_id, limit=50)  # Get more for summary
        
        if len(messages) < 5:
            return "Thread too short to summarize."
            
        # Build conversation text
        conversation = []
        for msg in messages:
            conversation.append(f"{msg['role'].upper()}: {msg['content']}")
            
        conversation_text = "\n".join(conversation)
        
        # Create summary prompt
        summary_prompt = f"""Summarize this company chat conversation in 2-3 sentences, focusing on key decisions, action items, and important information discussed:

{conversation_text}

Summary:"""

        generate_opts = GenerateOptions(
            model=self.company_model,
            temperature=0.3,
            num_ctx=1024,
            keep_alive=0,
            stream=False
        )
        
        try:
            response = await self.ollama_client.generate(generate_opts, summary_prompt)
            summary = response.get('response', 'Unable to generate summary.')
            
            # Store summary as system message
            async with get_db_session() as session:
                summary_msg = CompanyChatMessage(
                    id=uuid4(),
                    thread_id=thread_id,
                    role="system",
                    content=f"[THREAD SUMMARY]: {summary}",
                    model_used=self.company_model
                )
                session.add(summary_msg)
                await session.commit()
                
            logger.info(f"Summarized thread {thread_id}")
            return summary
            
        except Exception as e:
            logger.error(f"Thread summarization failed: {e}")
            return f"Summarization failed: {str(e)}"


# Global service instance
_company_chat_service: Optional[CompanyChatService] = None


def get_company_chat_service() -> CompanyChatService:
    """Get global Company Chat service instance"""
    global _company_chat_service
    if _company_chat_service is None:
        _company_chat_service = CompanyChatService()
    return _company_chat_service