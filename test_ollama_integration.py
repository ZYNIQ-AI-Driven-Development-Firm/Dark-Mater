#!/usr/bin/env python3
"""
Test script for Ollama integration with Dark Matter MCP
Demonstrates the AI chat capabilities
"""

import asyncio
import json
import sys
from typing import AsyncGenerator

import httpx


class OllamaIntegrationTest:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)
        self.token = None

    async def login(self, email: str = "test@example.com"):
        """Login and get authentication token"""
        print(f"🔐 Requesting OTP for {email}...")
        
        # Request OTP
        response = await self.client.post(
            f"{self.base_url}/api/v1/auth/otp/request",
            json={"email": email}
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to request OTP: {response.text}")
            return False
            
        result = response.json()
        print(f"✅ OTP requested. Dev OTP: {result.get('dev_otp', 'Check your email')}")
        
        # Get OTP from user
        otp = input("Enter OTP: ").strip()
        
        # Verify OTP
        response = await self.client.post(
            f"{self.base_url}/api/v1/auth/otp/verify",
            json={"email": email, "code": otp}
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to verify OTP: {response.text}")
            return False
            
        result = response.json()
        self.token = result["access_token"]
        print("✅ Successfully authenticated!")
        return True

    def get_headers(self):
        """Get authentication headers"""
        return {"Authorization": f"Bearer {self.token}"}

    async def test_health(self):
        """Test health endpoints"""
        print("\n🏥 Testing health endpoints...")
        
        endpoints = [
            "/healthz",
            "/api/v1/health/ollama",
            "/api/v1/health/all"
        ]
        
        for endpoint in endpoints:
            try:
                response = await self.client.get(f"{self.base_url}{endpoint}")
                status = "✅" if response.status_code == 200 else "❌"
                print(f"{status} {endpoint}: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    if "ollama" in endpoint and "models" in result:
                        print(f"   Available models: {', '.join(result['models'])}")
            except Exception as e:
                print(f"❌ {endpoint}: Error - {e}")

    async def test_company_chat(self):
        """Test company chat with streaming"""
        print("\n💬 Testing Company Chat...")
        
        message = input("Enter message for company chat: ").strip() or "What services does our company offer?"
        
        try:
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/v1/chat/company",
                json={
                    "message": message,
                    "model": "llama3.2:3b"
                },
                headers=self.get_headers()
            ) as response:
                if response.status_code != 200:
                    print(f"❌ Company chat failed: {response.status_code}")
                    print(await response.aread())
                    return
                
                print("🤖 Company Chat Response:")
                print("-" * 50)
                
                sources = []
                answer = ""
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            
                            if data["type"] == "source":
                                sources.append(data["content"])
                                print(f"📄 Source: {data['content']['title']}")
                            
                            elif data["type"] == "chunk":
                                chunk = data["content"]
                                answer += chunk
                                print(chunk, end="", flush=True)
                            
                            elif data["type"] == "done":
                                print("\n" + "-" * 50)
                                print(f"✅ Company chat completed. Used {len(sources)} sources.")
                                break
                                
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            print(f"❌ Company chat error: {e}")

    async def test_mcp_chat(self):
        """Test MCP chat (requires a server)"""
        print("\n🖥️ Testing MCP Chat...")
        
        # Get available servers
        try:
            response = await self.client.get(
                f"{self.base_url}/api/v1/servers",
                headers=self.get_headers()
            )
            
            if response.status_code != 200:
                print("❌ Failed to fetch servers")
                return
                
            servers = response.json().get("servers", [])
            if not servers:
                print("ℹ️ No MCP servers found. Please add a server first.")
                return
                
            print(f"Found {len(servers)} server(s):")
            for i, server in enumerate(servers):
                print(f"{i+1}. {server['name']} ({server['status']})")
            
            # Select server
            try:
                choice = int(input("Select server (number): ")) - 1
                if choice < 0 or choice >= len(servers):
                    print("❌ Invalid selection")
                    return
                    
                server = servers[choice]
                server_id = server["id"]
                
            except (ValueError, IndexError):
                print("❌ Invalid selection")
                return
            
            message = input("Enter message for MCP chat: ").strip() or "What can you help me with?"
            
            # Send MCP chat message
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/v1/chat/mcp/{server_id}",
                json={
                    "message": message,
                    "model": "llama3.2:3b"
                },
                headers=self.get_headers()
            ) as response:
                if response.status_code != 200:
                    print(f"❌ MCP chat failed: {response.status_code}")
                    print(await response.aread())
                    return
                
                print(f"🤖 MCP Chat Response ({server['name']}):")
                print("-" * 50)
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            
                            if data["type"] == "chunk":
                                print(data["content"], end="", flush=True)
                            
                            elif data["type"] == "done":
                                print("\n" + "-" * 50)
                                print("✅ MCP chat completed.")
                                break
                                
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            print(f"❌ MCP chat error: {e}")

    async def run_tests(self):
        """Run all tests"""
        try:
            print("🚀 Dark Matter MCP - Ollama Integration Test")
            print("=" * 50)
            
            # Login
            if not await self.login():
                return
            
            # Test health
            await self.test_health()
            
            # Test company chat
            await self.test_company_chat()
            
            # Test MCP chat
            await self.test_mcp_chat()
            
            print("\n✅ All tests completed!")
            
        except KeyboardInterrupt:
            print("\n⏹️ Tests interrupted by user")
        except Exception as e:
            print(f"\n❌ Test error: {e}")
        finally:
            await self.client.aclose()


async def main():
    """Main function"""
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    tester = OllamaIntegrationTest(base_url)
    await tester.run_tests()


if __name__ == "__main__":
    asyncio.run(main())