"""
MCP Server management routes.
"""
import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.auth.dependencies import get_async_session, get_current_active_user
from app.db.models import User, McpServer, ToolExecution
from app.schemas import (
    McpServerCreate, McpServerUpdate, McpServerResponse, McpServerTest,
    McpServerStatus, ServerListResponse, SuccessResponse, McpServerEnroll,
    KaliServerHealth, ToolExecutionRequest, ToolExecutionResponse,
    ToolListResponse, ArtifactListResponse, NgrokInfoResponse
)
from app.services.mcp import MCPService
from app.services.kali_mcp import KaliMCPService

router = APIRouter()
mcp_service = MCPService()
kali_mcp_service = KaliMCPService()


@router.get("", response_model=ServerListResponse)
async def get_servers(
    page: Optional[int] = Query(1, ge=1),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get user's MCP servers."""
    offset = (page - 1) * 20  # 20 servers per page
    
    statement = select(McpServer).where(
        McpServer.owner_id == current_user.id
    ).offset(offset).limit(21)  # Get one extra to check if there are more
    
    result = await session.execute(statement)
    servers = result.scalars().all()
    
    # Check if there are more pages
    has_next = len(servers) > 20
    if has_next:
        servers = servers[:20]
    
    return ServerListResponse(
        servers=[McpServerResponse.model_validate(server) for server in servers],
        next=str(page + 1) if has_next else None
    )


@router.post("", response_model=McpServerResponse)
async def create_server(
    server_data: McpServerCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Create a new MCP server."""
    # Check if server name already exists for this user
    statement = select(McpServer).where(
        McpServer.owner_id == current_user.id,
        McpServer.name == server_data.name
    )
    result = await session.execute(statement)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Server name already exists"
        )
    
    # Encrypt credentials if provided
    encrypted_credentials = None
    if server_data.credentials:
        encrypted_credentials = await mcp_service.encrypt_credentials(server_data.credentials)
    
    # Create server
    server = McpServer(
        name=server_data.name,
        url=server_data.url,
        auth_method=server_data.auth_method,
        credentials=encrypted_credentials,
        timeout=server_data.timeout,
        ssl_verify=server_data.ssl_verify,
        owner_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(server)
    await session.commit()
    await session.refresh(server)
    
    # Test connection in background
    await mcp_service.test_connection_async(server)
    
    return McpServerResponse.model_validate(server)


@router.put("/{server_id}", response_model=McpServerResponse)
async def update_server(
    server_id: UUID,
    server_data: McpServerUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Update MCP server."""
    statement = select(McpServer).where(
        McpServer.id == server_id,
        McpServer.owner_id == current_user.id
    )
    result = await session.execute(statement)
    server = result.scalar_one_or_none()
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    # Update fields
    if server_data.name is not None:
        # Check if new name conflicts
        name_check = select(McpServer).where(
            McpServer.owner_id == current_user.id,
            McpServer.name == server_data.name,
            McpServer.id != server_id
        )
        result = await session.execute(name_check)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Server name already exists"
            )
        server.name = server_data.name
    
    if server_data.url is not None:
        server.url = server_data.url
    
    if server_data.auth_method is not None:
        server.auth_method = server_data.auth_method
    
    if server_data.credentials is not None:
        server.credentials = await mcp_service.encrypt_credentials(server_data.credentials)
    
    if server_data.timeout is not None:
        server.timeout = server_data.timeout
    
    if server_data.ssl_verify is not None:
        server.ssl_verify = server_data.ssl_verify
    
    server.updated_at = datetime.utcnow()
    
    session.add(server)
    await session.commit()
    await session.refresh(server)
    
    return McpServerResponse.model_validate(server)


@router.delete("/{server_id}", response_model=SuccessResponse)
async def delete_server(
    server_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Delete MCP server."""
    statement = select(McpServer).where(
        McpServer.id == server_id,
        McpServer.owner_id == current_user.id
    )
    result = await session.execute(statement)
    server = result.scalar_one_or_none()
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    await session.delete(server)
    await session.commit()
    
    return SuccessResponse(status="deleted")


@router.post("/test", response_model=dict)
async def test_server_connection(
    server_data: McpServerTest,
    current_user: User = Depends(get_current_active_user)
):
    """Test MCP server connection."""
    try:
        logger.info(f"Testing connection to {server_data.url}")
        
        # Create temporary server object for testing
        temp_server = McpServer(
            name="test",
            url=server_data.url,
            auth_method=server_data.auth_method,
            credentials=json.dumps(server_data.credentials) if server_data.credentials else None,
            timeout=server_data.timeout,
            ssl_verify=server_data.ssl_verify,
            owner_id=current_user.id
        )
        
        success, message = await mcp_service.test_connection(temp_server)
        logger.info(f"Test result: success={success}, message={message}")
        
        if success:
            return {"status": "success", "message": message}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection failed: {message}"
            )
    
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Connection test failed: {str(e)}"
        )


@router.get("/{server_id}/status", response_model=McpServerStatus)
async def get_server_status(
    server_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get server connection status."""
    statement = select(McpServer).where(
        McpServer.id == server_id,
        McpServer.owner_id == current_user.id
    )
    result = await session.execute(statement)
    server = result.scalar_one_or_none()
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    # Test connection and get latency
    success, latency = await mcp_service.ping_server(server)
    
    return McpServerStatus(
        status="online" if success else "offline",
        latency=latency if success else None,
        last_checked=datetime.utcnow()
    )


# Kali MCP Server specific endpoints
@router.post("/enroll", response_model=McpServerResponse)
async def enroll_kali_server(
    enrollment_data: McpServerEnroll,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Enroll a new Kali MCP server using enrollment token."""
    
    # Check if server name already exists for this user
    statement = select(McpServer).where(
        McpServer.owner_id == current_user.id,
        McpServer.name == enrollment_data.name
    )
    result = await session.execute(statement)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Server name already exists"
        )
    
    # Attempt enrollment
    result = await kali_mcp_service.enroll_server(enrollment_data, current_user.id, session)
    
    if result["success"]:
        return McpServerResponse.model_validate(result["server"])
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )


@router.get("/{server_id}/tools", response_model=ToolListResponse)
async def get_server_tools(
    server_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get available tools from Kali MCP server."""
    statement = select(McpServer).where(
        McpServer.id == server_id,
        McpServer.owner_id == current_user.id
    )
    result = await session.execute(statement)
    server = result.scalar_one_or_none()
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    if server.server_type != "kali":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is only available for Kali MCP servers"
        )
    
    result = await kali_mcp_service.get_available_tools(server)
    
    if result["success"]:
        return ToolListResponse(tools=result["tools"])
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )


@router.post("/{server_id}/tools/execute", response_model=ToolExecutionResponse)
async def execute_tool(
    server_id: UUID,
    tool_request: ToolExecutionRequest,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Execute a tool on Kali MCP server."""
    statement = select(McpServer).where(
        McpServer.id == server_id,
        McpServer.owner_id == current_user.id
    )
    result = await session.execute(statement)
    server = result.scalar_one_or_none()
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    if server.server_type != "kali":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tool execution is only available for Kali MCP servers"
        )
    
    result = await kali_mcp_service.execute_tool(server, tool_request, current_user.id, session)
    
    if result["success"]:
        execution = result["execution"]
        return ToolExecutionResponse(
            id=execution.id,
            rc=execution.return_code,
            summary=execution.summary,
            artifact_uri=execution.artifact_uri,
            findings=json.loads(execution.findings) if execution.findings else [],
            status=execution.status,
            started_at=execution.started_at,
            completed_at=execution.completed_at,
            duration_ms=execution.duration_ms
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )


@router.get("/{server_id}/artifacts", response_model=ArtifactListResponse)
async def get_server_artifacts(
    server_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get artifacts list from Kali MCP server."""
    statement = select(McpServer).where(
        McpServer.id == server_id,
        McpServer.owner_id == current_user.id
    )
    result = await session.execute(statement)
    server = result.scalar_one_or_none()
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    if server.server_type != "kali":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artifacts are only available for Kali MCP servers"
        )
    
    result = await kali_mcp_service.get_artifacts(server, limit, offset)
    
    if result["success"]:
        artifacts_data = result["artifacts"]
        return ArtifactListResponse(
            items=artifacts_data.get("items", []),
            nextOffset=artifacts_data.get("nextOffset")
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )


@router.get("/{server_id}/artifacts/read")
async def read_artifact(
    server_id: UUID,
    uri: str = Query(..., description="Full artifact URI"),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Read artifact content from Kali MCP server."""
    statement = select(McpServer).where(
        McpServer.id == server_id,
        McpServer.owner_id == current_user.id
    )
    result = await session.execute(statement)
    server = result.scalar_one_or_none()
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    if server.server_type != "kali":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artifact reading is only available for Kali MCP servers"
        )
    
    result = await kali_mcp_service.read_artifact(server, uri)
    
    if result["success"]:
        return Response(
            content=result["content"],
            media_type=result["content_type"]
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )


@router.get("/{server_id}/ngrok", response_model=NgrokInfoResponse)
async def get_ngrok_info(
    server_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get Ngrok tunnel information from Kali MCP server."""
    statement = select(McpServer).where(
        McpServer.id == server_id,
        McpServer.owner_id == current_user.id
    )
    result = await session.execute(statement)
    server = result.scalar_one_or_none()
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found"
        )
    
    if server.server_type != "kali":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ngrok info is only available for Kali MCP servers"
        )
    
    result = await kali_mcp_service.get_ngrok_info(server)
    
    if result["success"]:
        ngrok_data = result["ngrok_info"]
        # Update server with ngrok info in session
        await session.commit()
        
        return NgrokInfoResponse(
            status=ngrok_data["status"],
            public_url=ngrok_data.get("public_url"),
            local_port=ngrok_data.get("local_port"),
            protocol=ngrok_data.get("protocol"),
            name=ngrok_data.get("name")
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
