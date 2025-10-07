"""
Database models using SQLModel.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship, Column, Text
from sqlalchemy import Index
from pgvector.sqlalchemy import Vector


class User(SQLModel, table=True):
    """User model."""
    __tablename__ = "users"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=50)
    email: str = Field(unique=True, index=True, max_length=255)
    is_active: bool = Field(default=True)
    deletion_grace_period: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    mcp_servers: list["McpServer"] = Relationship(back_populates="owner")


class McpServer(SQLModel, table=True):
    """MCP Server configuration model."""
    __tablename__ = "mcp_servers"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=100)
    url: str = Field(max_length=500)
    
    # Server connection type - "kali" for Kali MCP servers, "generic" for others
    server_type: str = Field(default="generic", max_length=20)
    
    # Traditional auth for generic servers
    auth_method: str = Field(max_length=20)  # "none", "api_key", "oauth", "enrollment"
    credentials: Optional[str] = Field(default=None)  # Encrypted JSON
    
    # Kali MCP server specific fields
    server_id: Optional[str] = Field(default=None, max_length=100)  # From Kali server
    api_key: Optional[str] = Field(default=None)  # Encrypted API key from enrollment
    enrollment_id: Optional[str] = Field(default=None, max_length=100)  # Enrollment token ID
    
    # Server configuration
    timeout: int = Field(default=30)
    ssl_verify: bool = Field(default=True)
    
    # Status and monitoring
    status: str = Field(default="offline", max_length=20)  # "active", "inactive", "error"
    last_seen: Optional[datetime] = Field(default=None)
    last_checked: Optional[datetime] = Field(default=None)
    latency_ms: Optional[int] = Field(default=None)
    
    # Server capabilities (from health check)
    capabilities: Optional[str] = Field(default=None)  # Encrypted JSON
    
    # Ngrok support for Kali servers
    ngrok_url: Optional[str] = Field(default=None, max_length=500)
    local_port: Optional[int] = Field(default=None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign key
    owner_id: UUID = Field(foreign_key="users.id")
    
    # Relationships
    owner: User = Relationship(back_populates="mcp_servers")


class ToolExecution(SQLModel, table=True):
    """Tool execution results model for Kali MCP servers."""
    __tablename__ = "tool_executions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    server_id: UUID = Field(foreign_key="mcp_servers.id")
    user_id: UUID = Field(foreign_key="users.id")
    
    # Tool execution details
    tool_name: str = Field(max_length=100)
    arguments: str = Field()  # JSON string of arguments
    
    # Execution results
    return_code: int = Field(default=0)
    summary: Optional[str] = Field(default=None)
    artifact_uri: Optional[str] = Field(default=None, max_length=500)
    findings: Optional[str] = Field(default=None)  # JSON string of findings
    
    # Timing
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)
    duration_ms: Optional[int] = Field(default=None)
    
    # Status
    status: str = Field(default="running", max_length=20)  # "running", "completed", "failed"
    error_message: Optional[str] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RefreshToken(SQLModel, table=True):
    """Refresh token model for JWT management."""
    __tablename__ = "refresh_tokens"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    token_hash: str = Field(unique=True, index=True)
    user_id: UUID = Field(foreign_key="users.id")
    device_fingerprint: Optional[str] = Field(default=None)
    expires_at: datetime
    is_revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CompanyChatThread(SQLModel, table=True):
    """Company chat threads for shared knowledge conversations."""
    __tablename__ = "company_chat_threads"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: Optional[str] = Field(default=None, max_length=200)
    user_id: UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    messages: List["CompanyChatMessage"] = Relationship(back_populates="thread")


class CompanyChatMessage(SQLModel, table=True):
    """Messages in company chat threads."""
    __tablename__ = "company_chat_messages" 
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    thread_id: UUID = Field(foreign_key="company_chat_threads.id")
    role: str = Field(max_length=20)  # 'user', 'assistant', 'system'
    content: str = Field(sa_column=Column(Text))
    model_used: Optional[str] = Field(default=None, max_length=100)
    token_count: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    thread: CompanyChatThread = Relationship(back_populates="messages")
    
    # Index for efficient retrieval
    __table_args__ = (
        Index('idx_messages_thread_created', 'thread_id', 'created_at'),
    )


class CompanyMemoryChunk(SQLModel, table=True):
    """Company knowledge base chunks for RAG."""
    __tablename__ = "company_memory_chunks"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=200)
    source: str = Field(max_length=500)  # Source document/URL/ID for citations
    source_type: str = Field(default="document", max_length=50)  # 'document', 'policy', 'faq', etc.
    text: str = Field(sa_column=Column(Text))
    embedding: Optional[List[float]] = Field(default=None, sa_column=Column(Vector(768)))  # 768-dim embeddings
    chunk_index: int = Field(default=0)  # For ordered chunks from same source
    meta_data: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Indexes for efficient similarity search
    __table_args__ = (
        Index('idx_chunks_source', 'source'),
        Index('idx_chunks_source_type', 'source_type'),
        # Vector index will be created in migration
    )