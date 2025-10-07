"""
Backend API Endpoint Audit Report
Checking all endpoints and their frontend integration status
"""

# Based on main.py route includes and endpoint analysis
BACKEND_ENDPOINTS = {
    # Health endpoints
    "health": [
        {"method": "GET", "path": "/healthz", "full_url": "/healthz", "description": "Health check"}
    ],
    
    # Authentication endpoints  
    "auth": [
        {"method": "POST", "path": "/otp/request", "full_url": "/api/v1/auth/otp/request", "description": "Request OTP"},
        {"method": "POST", "path": "/otp/verify", "full_url": "/api/v1/auth/otp/verify", "description": "Verify OTP"},
        {"method": "POST", "path": "/refresh", "full_url": "/api/v1/auth/refresh", "description": "Refresh token"},
        {"method": "POST", "path": "/logout", "full_url": "/api/v1/auth/logout", "description": "Logout user"}
    ],
    
    # User endpoints
    "users": [
        {"method": "GET", "path": "/profile", "full_url": "/api/v1/user/profile", "description": "Get user profile"},
        {"method": "PUT", "path": "/profile", "full_url": "/api/v1/user/profile", "description": "Update user profile"}
    ],
    
    # Server management endpoints
    "servers": [
        {"method": "GET", "path": "", "full_url": "/api/v1/servers", "description": "List servers"},
        {"method": "POST", "path": "", "full_url": "/api/v1/servers", "description": "Create server"},
        {"method": "PUT", "path": "/{server_id}", "full_url": "/api/v1/servers/{server_id}", "description": "Update server"},
        {"method": "DELETE", "path": "/{server_id}", "full_url": "/api/v1/servers/{server_id}", "description": "Delete server"},
        {"method": "POST", "path": "/test", "full_url": "/api/v1/servers/test", "description": "Test server connection"},
        {"method": "GET", "path": "/{server_id}/status", "full_url": "/api/v1/servers/{server_id}/status", "description": "Get server status"}
    ],
    
    # WebSocket endpoints
    "websocket": [
        {"method": "WS", "path": "/server/{server_id}", "full_url": "/ws/server/{server_id}", "description": "WebSocket connection to server"}
    ],
    
    # Chat endpoints (if included)
    "chat": [
        {"method": "GET", "path": "/models", "full_url": "/api/v1/chat/models", "description": "List available models"},
        {"method": "POST", "path": "/models/{model_name}/pull", "full_url": "/api/v1/chat/models/{model_name}/pull", "description": "Pull model"},
        {"method": "POST", "path": "/servers/{server_id}/chat", "full_url": "/api/v1/chat/servers/{server_id}/chat", "description": "Send chat message"},
        {"method": "DELETE", "path": "/servers/{server_id}/chat", "full_url": "/api/v1/chat/servers/{server_id}/chat", "description": "Clear chat history"},
        {"method": "WS", "path": "/ws/chat/{server_id}", "full_url": "/ws/chat/{server_id}", "description": "Chat WebSocket"}
    ]
}

# Frontend API calls found in code
FRONTEND_API_CALLS = [
    # From ApiClient.ts - Authentication
    {"url": "/auth/otp/request", "method": "POST", "file": "ApiClient.ts", "function": "requestOtp"},
    {"url": "/auth/otp/verify", "method": "POST", "file": "ApiClient.ts", "function": "verifyOtp"},
    {"url": "/auth/logout", "method": "POST", "file": "ApiClient.ts", "function": "logout"},
    {"url": "/auth/refresh", "method": "POST", "file": "ApiClient.ts", "function": "refreshToken"},
    
    # From ApiClient.ts - Server Management
    {"url": "/servers", "method": "GET", "file": "ApiClient.ts", "function": "getServers"},
    {"url": "/servers", "method": "POST", "file": "ApiClient.ts", "function": "createServer"},
    {"url": "/servers/{serverId}", "method": "PUT", "file": "ApiClient.ts", "function": "updateServer"},
    {"url": "/servers/{serverId}", "method": "DELETE", "file": "ApiClient.ts", "function": "deleteServer"},
    {"url": "/servers/test", "method": "POST", "file": "ApiClient.ts", "function": "testServerConnection"},
    {"url": "/servers/{serverId}/status", "method": "GET", "file": "ApiClient.ts", "function": "getServerStatus"},
    
    # From ApiClient.ts - User Profile
    {"url": "/user/profile", "method": "GET", "file": "ApiClient.ts", "function": "getUserProfile"},
    {"url": "/user/profile", "method": "PUT", "file": "ApiClient.ts", "function": "updateUserProfile"},
    
    # From ApiClient.ts - Chat
    {"url": "/chat/models", "method": "GET", "file": "ApiClient.ts", "function": "getAvailableModels"},
    {"url": "/chat/models/{model_name}/pull", "method": "POST", "file": "ApiClient.ts", "function": "pullModel"},
    {"url": "/chat/servers/{serverId}/chat", "method": "POST", "file": "ApiClient.ts", "function": "sendChatMessage"},
    {"url": "/chat/servers/{serverId}/chat", "method": "DELETE", "file": "ApiClient.ts", "function": "clearChatHistory"},
    
    # From ApiClient.ts - WebSocket
    {"url": "/ws/server/{serverId}", "method": "WS", "file": "ApiClient.ts", "function": "createServerWebSocket"},
    {"url": "/ws/chat/{serverId}", "method": "WS", "file": "ApiClient.ts", "function": "createChatWebSocket"},
    
    # From ApiClient.ts - Health
    {"url": "/healthz", "method": "GET", "file": "ApiClient.ts", "function": "healthCheck"},
    
    # From MainPage.tsx (duplicate logout)
    {"url": "/auth/logout", "method": "POST", "file": "MainPage.tsx", "function": "handleLogout"}
]

def check_endpoint_integration():
    """Check which endpoints are connected to frontend"""
    
    print("=== BACKEND API ENDPOINT AUDIT REPORT ===\n")
    
    # Convert frontend calls to a set for easy lookup
    frontend_urls = set()
    for call in FRONTEND_API_CALLS:
        # Normalize URLs (remove /api/v1 prefix and template variables)
        url = call["url"].replace("/api/v1", "")
        url = url.replace("{serverId}", "{server_id}")
        frontend_urls.add((call["method"], url))
    
    total_endpoints = 0
    connected_endpoints = 0
    missing_connections = []
    
    for category, endpoints in BACKEND_ENDPOINTS.items():
        print(f"📁 {category.upper()} ENDPOINTS:")
        print("-" * 50)
        
        for endpoint in endpoints:
            total_endpoints += 1
            method = endpoint["method"]
            path = endpoint["path"]
            full_url = endpoint["full_url"]
            description = endpoint["description"]
            
            # Check if this endpoint has a frontend connection
            # Remove /api/v1 prefix for comparison
            normalized_path = path
            if full_url.startswith("/api/v1"):
                normalized_path = full_url.replace("/api/v1", "")
            elif full_url.startswith("/ws"):
                normalized_path = full_url
            else:
                normalized_path = full_url
                
            is_connected = (method, normalized_path) in frontend_urls
            
            status = "✅ CONNECTED" if is_connected else "❌ NOT CONNECTED"
            if is_connected:
                connected_endpoints += 1
            else:
                missing_connections.append({
                    "method": method,
                    "path": full_url,
                    "description": description,
                    "category": category
                })
            
            print(f"  {method:6} {full_url:40} - {description:30} {status}")
        
        print()
    
    # Summary
    print("=== SUMMARY ===")
    print(f"Total Backend Endpoints: {total_endpoints}")
    print(f"Connected to Frontend:   {connected_endpoints}")
    print(f"Missing Connections:     {total_endpoints - connected_endpoints}")
    print(f"Connection Rate:         {(connected_endpoints/total_endpoints)*100:.1f}%")
    
    # Missing connections detail
    if missing_connections:
        print("\n=== MISSING FRONTEND CONNECTIONS ===")
        print("-" * 50)
        for missing in missing_connections:
            print(f"❌ {missing['method']:6} {missing['path']:40} - {missing['description']}")
            print(f"   Category: {missing['category']}")
            print(f"   Need to add to: ApiClient.ts or relevant component")
            print()
    
    # Extra frontend calls (not matching backend)
    print("\n=== FRONTEND CALLS ANALYSIS ===")
    print("-" * 50)
    
    backend_urls = set()
    for category, endpoints in BACKEND_ENDPOINTS.items():
        for endpoint in endpoints:
            method = endpoint["method"]
            path = endpoint["path"]
            full_url = endpoint["full_url"]
            
            normalized_path = path
            if full_url.startswith("/api/v1"):
                normalized_path = full_url.replace("/api/v1", "")
            elif full_url.startswith("/ws"):
                normalized_path = full_url
            else:
                normalized_path = full_url
                
            backend_urls.add((method, normalized_path))
    
    print("Frontend API calls found:")
    for call in FRONTEND_API_CALLS:
        url = call["url"].replace("/api/v1", "")
        url = url.replace("{serverId}", "{server_id}")
        match_found = (call["method"], url) in backend_urls
        status = "✅ MATCHES BACKEND" if match_found else "⚠️  NO BACKEND MATCH"
        print(f"  {call['method']:6} {call['url']:40} - {call['file']:15} {status}")

if __name__ == "__main__":
    check_endpoint_integration()