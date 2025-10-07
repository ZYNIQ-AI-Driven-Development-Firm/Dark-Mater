"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# Base schemas
class TimestampMixin(BaseModel):
    """Mixin for timestamp fields."""
    created_at: datetime
    updated_at: datetime


# User schemas
class UserBase(BaseModel):
    """Base user schema."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    """User creation schema."""
    pass


class UserUpdate(BaseModel):
    """User update schema."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)


class UserResponse(UserBase, TimestampMixin):
    """User response schema."""
    id: UUID
    is_active: bool

    class Config:
        from_attributes = True


# Auth schemas
class OtpRequest(BaseModel):
    """OTP request schema."""
    email: EmailStr


class OtpVerify(BaseModel):
    """OTP verification schema."""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    device_fingerprint: Optional[str] = Field(None, max_length=255)


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    is_new_user: bool
    user: UserResponse


class TokenRefresh(BaseModel):
    """Token refresh schema."""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout request schema."""
    refresh_token: str


# MCP Server schemas
class McpServerBase(BaseModel):
    """Base MCP server schema."""
    name: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., max_length=500)
    server_type: str = Field(default="generic", pattern="^(generic|kali)$")
    auth_method: str = Field(..., pattern="^(none|api_key|oauth|enrollment)$")
    timeout: int = Field(default=30, ge=1, le=300)
    ssl_verify: bool = Field(default=True)


class McpServerCreate(McpServerBase):
    """MCP server creation schema."""
    credentials: Optional[dict] = Field(default=None)
    # Kali MCP server enrollment fields
    enrollment_id: Optional[str] = Field(None, max_length=100)
    enrollment_token: Optional[str] = Field(None, max_length=200)


class McpServerUpdate(BaseModel):
    """MCP server update schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    url: Optional[str] = Field(None, max_length=500)
    server_type: Optional[str] = Field(None, pattern="^(generic|kali)$")
    auth_method: Optional[str] = Field(None, pattern="^(none|api_key|oauth|enrollment)$")
    credentials: Optional[dict] = Field(default=None)
    timeout: Optional[int] = Field(None, ge=1, le=300)
    ssl_verify: Optional[bool] = Field(None)


class McpServerTest(BaseModel):
    """MCP server test schema."""
    url: str = Field(..., max_length=500)
    auth_method: str = Field(..., pattern="^(none|api_key|oauth|enrollment)$")
    credentials: Optional[dict] = Field(default=None)
    timeout: int = Field(default=30, ge=1, le=300)
    ssl_verify: bool = Field(default=True)
    # For Kali server testing
    enrollment_id: Optional[str] = Field(None, max_length=100)
    enrollment_token: Optional[str] = Field(None, max_length=200)


class McpServerEnroll(BaseModel):
    """Kali MCP server enrollment schema."""
    name: str = Field(..., min_length=1, max_length=100)
    host: str = Field(..., max_length=255)
    port: int = Field(default=5000, ge=1, le=65535)
    enrollment_id: str = Field(..., max_length=100)
    enrollment_token: str = Field(..., max_length=200)
    ssl_verify: bool = Field(default=True)


class McpServerResponse(McpServerBase, TimestampMixin):
    """MCP server response schema."""
    id: UUID
    server_type: str
    server_id: Optional[str] = None
    status: str
    last_seen: Optional[datetime] = None
    last_checked: Optional[datetime] = None
    latency_ms: Optional[int] = None
    capabilities: Optional[dict] = None
    ngrok_url: Optional[str] = None
    local_port: Optional[int] = None
    owner_id: UUID

    class Config:
        from_attributes = True


class McpServerStatus(BaseModel):
    """MCP server status schema."""
    status: str = Field(..., pattern="^(active|inactive|error)$")
    latency_ms: Optional[int] = Field(None, ge=0)
    last_seen: Optional[datetime] = None
    capabilities: Optional[dict] = None


class KaliServerHealth(BaseModel):
    """Kali server health response schema."""
    ok: bool
    server_id: str
    caps: dict
    time: datetime


class ServerListResponse(BaseModel):
    """Server list response schema."""
    servers: List[McpServerResponse]
    next: Optional[str] = None


# Tool execution schemas
class ToolExecutionRequest(BaseModel):
    """Tool execution request schema."""
    name: str = Field(..., max_length=100)
    arguments: dict = Field(...)


class ToolExecutionResponse(BaseModel):
    """Tool execution response schema."""
    id: UUID
    rc: int
    summary: Optional[str] = None
    artifact_uri: Optional[str] = None
    findings: List[dict] = Field(default_factory=list)
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None


class ToolListResponse(BaseModel):
    """Available tools list response schema."""
    tools: List[dict] = Field(default_factory=list)


class ArtifactListResponse(BaseModel):
    """Artifacts list response schema."""
    items: List[dict] = Field(default_factory=list)
    nextOffset: Optional[int] = None


class NgrokInfoResponse(BaseModel):
    """Ngrok status response schema."""
    status: str
    public_url: Optional[str] = None
    local_port: Optional[int] = None
    protocol: Optional[str] = None
    name: Optional[str] = None


# WebSocket schemas
class WebSocketMessage(BaseModel):
    """Base WebSocket message schema."""
    type: str
    payload: dict


class ChatMessage(BaseModel):
    """Chat message schema."""
    type: str = "chat_message"
    payload: dict = Field(..., example={"text": "Hello, world!"})


class TaskApproval(BaseModel):
    """Task approval schema."""
    type: str = "approve_task"
    payload: dict = Field(..., example={"node_id": "node1"})


# Error schemas
class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = False
    error: str
    code: Optional[str] = None


class SuccessResponse(BaseModel):
    """Success response schema."""
    success: bool = True
    message: Optional[str] = None