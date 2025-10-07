"""
Kali MCP Server management service.
Handles enrollment, tool execution, and server communication.
"""
import json
import httpx
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from cryptography.fernet import Fernet
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import McpServer, ToolExecution
from app.schemas import (
    McpServerEnroll, KaliServerHealth, ToolExecutionRequest, 
    ToolExecutionResponse, ToolListResponse, ArtifactListResponse, NgrokInfoResponse
)

settings = get_settings()


class KaliMCPService:
    """Service for managing Kali MCP servers."""
    
    def __init__(self):
        self.encryption_key = settings.ENCRYPTION_KEY.encode() if hasattr(settings, 'ENCRYPTION_KEY') else Fernet.generate_key()
        self.cipher_suite = Fernet(self.encryption_key)
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data."""
        return self.cipher_suite.encrypt(data.encode()).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        return self.cipher_suite.decrypt(encrypted_data.encode()).decode()
    
    async def enroll_server(
        self, 
        enrollment_data: McpServerEnroll, 
        user_id: UUID,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """
        Enroll a new Kali MCP server using enrollment token.
        
        Args:
            enrollment_data: Enrollment form data
            user_id: User ID
            session: Database session
        
        Returns:
            Dictionary with success status and server data or error
        """
        url = f"http://{enrollment_data.host}:{enrollment_data.port}/enroll"
        
        payload = {
            "id": enrollment_data.enrollment_id,
            "token": enrollment_data.enrollment_token,
            "label": "DARK-MATTER-Dashboard"
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                
                result = response.json()
                
                # Create server record
                server = McpServer(
                    name=enrollment_data.name,
                    url=f"http://{enrollment_data.host}:{enrollment_data.port}",
                    server_type="kali",
                    auth_method="enrollment",
                    server_id=result["server_id"],
                    api_key=self.encrypt_data(result["api_key"]),
                    enrollment_id=enrollment_data.enrollment_id,
                    ssl_verify=enrollment_data.ssl_verify,
                    status="active",
                    owner_id=user_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                session.add(server)
                await session.commit()
                await session.refresh(server)
                
                # Test connection and get capabilities
                health_result = await self.test_connection(server)
                if health_result["success"]:
                    server.status = "active"
                    server.last_seen = datetime.utcnow()
                    server.capabilities = self.encrypt_data(json.dumps(health_result["capabilities"]))
                    await session.commit()
                
                return {
                    "success": True, 
                    "server": server,
                    "server_id": result["server_id"],
                    "api_key": result["api_key"][:8] + "..." # Only show first 8 characters
                }
                
        except httpx.RequestError as e:
            return {"success": False, "error": f"Connection error: {str(e)}"}
        except httpx.HTTPStatusError as e:
            try:
                error_detail = e.response.json()
                return {"success": False, "error": error_detail.get("detail", f"HTTP {e.response.status_code}")}
            except:
                return {"success": False, "error": f"HTTP {e.response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def test_connection(self, server: McpServer) -> Dict[str, Any]:
        """
        Test connection to Kali MCP server and get health status.
        
        Args:
            server: MCP server model
        
        Returns:
            Dictionary with connection test results
        """
        if server.server_type != "kali" or not server.api_key:
            return {"success": False, "error": "Invalid server configuration"}
        
        try:
            api_key = self.decrypt_data(server.api_key)
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                start_time = datetime.utcnow()
                response = await client.get(f"{server.url}/health", headers=headers)
                end_time = datetime.utcnow()
                
                response.raise_for_status()
                health_data = response.json()
                
                latency_ms = int((end_time - start_time).total_seconds() * 1000)
                
                return {
                    "success": True,
                    "latency_ms": latency_ms,
                    "server_id": health_data["server_id"],
                    "capabilities": health_data["caps"],
                    "timestamp": health_data["time"]
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_available_tools(self, server: McpServer) -> Dict[str, Any]:
        """
        Get list of available tools from Kali MCP server.
        
        Args:
            server: MCP server model
        
        Returns:
            Dictionary with tools list or error
        """
        if server.server_type != "kali" or not server.api_key:
            return {"success": False, "error": "Invalid server configuration"}
        
        try:
            api_key = self.decrypt_data(server.api_key)
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{server.url}/tools/list", headers=headers)
                response.raise_for_status()
                
                return {"success": True, "tools": response.json()["tools"]}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def execute_tool(
        self, 
        server: McpServer, 
        tool_request: ToolExecutionRequest,
        user_id: UUID,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """
        Execute a tool on Kali MCP server.
        
        Args:
            server: MCP server model
            tool_request: Tool execution request
            user_id: User ID
            session: Database session
        
        Returns:
            Dictionary with execution results or error
        """
        if server.server_type != "kali" or not server.api_key:
            return {"success": False, "error": "Invalid server configuration"}
        
        # Create execution record
        execution = ToolExecution(
            server_id=server.id,
            user_id=user_id,
            tool_name=tool_request.name,
            arguments=json.dumps(tool_request.arguments),
            status="running",
            started_at=datetime.utcnow()
        )
        
        session.add(execution)
        await session.commit()
        await session.refresh(execution)
        
        try:
            api_key = self.decrypt_data(server.api_key)
            headers = {"Authorization": f"Bearer {api_key}"}
            
            payload = {
                "name": tool_request.name,
                "arguments": tool_request.arguments
            }
            
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minute timeout for tools
                start_time = datetime.utcnow()
                response = await client.post(f"{server.url}/tools/call", json=payload, headers=headers)
                end_time = datetime.utcnow()
                
                response.raise_for_status()
                result = response.json()
                
                # Update execution record
                execution.return_code = result["rc"]
                execution.summary = result.get("summary")
                execution.artifact_uri = result.get("artifact_uri")
                execution.findings = json.dumps(result.get("findings", []))
                execution.completed_at = end_time
                execution.duration_ms = int((end_time - start_time).total_seconds() * 1000)
                execution.status = "completed"
                
                await session.commit()
                
                return {
                    "success": True,
                    "execution": execution,
                    "result": result
                }
                
        except Exception as e:
            # Update execution record with error
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            if execution.started_at:
                execution.duration_ms = int((execution.completed_at - execution.started_at).total_seconds() * 1000)
            await session.commit()
            
            return {"success": False, "error": str(e)}
    
    async def get_artifacts(self, server: McpServer, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        Get artifacts list from Kali MCP server.
        
        Args:
            server: MCP server model
            limit: Number of items to return
            offset: Pagination offset
        
        Returns:
            Dictionary with artifacts list or error
        """
        if server.server_type != "kali" or not server.api_key:
            return {"success": False, "error": "Invalid server configuration"}
        
        try:
            api_key = self.decrypt_data(server.api_key)
            headers = {"Authorization": f"Bearer {api_key}"}
            params = {"limit": limit, "offset": offset}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{server.url}/artifacts/list", headers=headers, params=params)
                response.raise_for_status()
                
                return {"success": True, "artifacts": response.json()}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def read_artifact(self, server: McpServer, artifact_uri: str) -> Dict[str, Any]:
        """
        Read artifact content from Kali MCP server.
        
        Args:
            server: MCP server model
            artifact_uri: Full artifact URI
        
        Returns:
            Dictionary with artifact content or error
        """
        if server.server_type != "kali" or not server.api_key:
            return {"success": False, "error": "Invalid server configuration"}
        
        try:
            api_key = self.decrypt_data(server.api_key)
            headers = {"Authorization": f"Bearer {api_key}"}
            params = {"uri": artifact_uri}
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{server.url}/artifacts/read", headers=headers, params=params)
                response.raise_for_status()
                
                return {
                    "success": True,
                    "content": response.text,
                    "content_type": response.headers.get("content-type", "text/plain")
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_ngrok_info(self, server: McpServer) -> Dict[str, Any]:
        """
        Get Ngrok tunnel information from Kali MCP server.
        
        Args:
            server: MCP server model
        
        Returns:
            Dictionary with Ngrok info or error
        """
        if server.server_type != "kali" or not server.api_key:
            return {"success": False, "error": "Invalid server configuration"}
        
        try:
            api_key = self.decrypt_data(server.api_key)
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{server.url}/ngrok/info", headers=headers)
                response.raise_for_status()
                
                ngrok_data = response.json()
                
                # Update server with ngrok info if active
                if ngrok_data.get("status") == "active":
                    server.ngrok_url = ngrok_data.get("public_url")
                    server.local_port = ngrok_data.get("local_port")
                else:
                    server.ngrok_url = None
                    server.local_port = None
                
                return {"success": True, "ngrok_info": ngrok_data}
                
        except Exception as e:
            return {"success": False, "error": str(e)}