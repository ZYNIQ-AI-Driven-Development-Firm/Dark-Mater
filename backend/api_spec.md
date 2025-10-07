# API Spec# Model Context Protocol (MCP) Client - Backend API Specification



## MetaThis document outlines the API endpoints required for the MCP client frontend.

version: 1.0.0

base_url: /api/v1---

## 1. Authentication

## Auth

- flow: **Email OTP** (one-time passcode) for login and signup.Handles user login and session management.

- steps:

  1. Client calls `POST /auth/otp/request` with `{ email }`.### 1.1 Request OTP

  2. Server generates a 6-digit code, stores a **hashed** code with TTL, rate-limits requests, and emails the code.- **Endpoint:** `POST /api/auth/otp/request`

  3. Client calls `POST /auth/otp/verify` with `{ email, code }`.- **Description:** Initiates the login process by sending a One-Time Password to the user's email.

  4. If user exists, authenticate; if not, **create account** (lightweight signup). Issue JWT access + refresh.- **Request Body:**

- tokens: Bearer JWT (access, refresh).  ```json

- refresh: `POST /auth/refresh`  {

    "email": "user@example.com"

## Endpoints  }

  ```

### GET /healthz- **Response (Success 200):**

- desc: health check  ```json

- req: none  {

- res: { status: "ok", ts: string }    "success": true,

- errors: 500    "message": "OTP has been sent to your email address."

  }

### POST /auth/otp/request  ```

- req: { email: string }- **Response (Error 400/500):**

- res: { status: "sent", cooldown_sec: number }  ```json

- errors: 400, 429  {

    "success": false,

### POST /auth/otp/verify    "error": "Invalid email format or server error."

- req: { email: string, code: string, device_fingerprint?: string }  }

- res: { access_token: string, refresh_token: string, is_new_user: boolean, user: User }  ```

- errors: 400, 401, 410, 429

### 1.2 Verify OTP & Login

### POST /auth/refresh- **Endpoint:** `POST /api/auth/otp/verify`

- req: { refresh_token: string }- **Description:** Verifies the OTP and, if successful, returns a session token (e.g., JWT).

- res: { access_token: string, refresh_token: string }- **Request Body:**

- errors: 401  ```json

  {

### POST /auth/logout    "email": "user@example.com",

- desc: invalidate refresh token    "otp": "123456"

- req: { refresh_token: string }  }

- res: { status: "ok" }  ```

- errors: 401- **Response (Success 200):**

  ```json

### GET /user/profile  {

- desc: get current user profile    "success": true,

- req: none (auth required)    "token": "your_jwt_session_token",

- res: User    "user": {

- errors: 401      "username": "terminal_user_01",

      "email": "user@example.com"

### PUT /user/profile    }

- desc: update user profile  }

- req: { username?: string }  ```

- res: User- **Response (Error 401):**

- errors: 400, 401  ```json

  {

### GET /servers    "success": false,

- desc: get user's MCP servers    "error": "Invalid OTP."

- query: { page?: number }  }

- res: { servers: McpServer[], next?: string }  ```

- errors: 401

### 1.3 Logout

### POST /servers- **Endpoint:** `POST /api/auth/logout`

- desc: add new MCP server- **Description:** Invalidates the user's session token.

- req: McpServerCreate- **Authentication:** Bearer Token required.

- res: McpServer- **Response (Success 200):**

- errors: 400, 401, 409  ```json

  {

### PUT /servers/{server_id}    "success": true

- desc: update MCP server  }

- req: McpServerUpdate  ```

- res: McpServer

- errors: 400, 401, 404---

## 2. User Profile

### DELETE /servers/{server_id}

- desc: remove MCP serverManages user-specific data.

- req: none

- res: { status: "deleted" }### 2.1 Get Profile

- errors: 401, 404- **Endpoint:** `GET /api/user/profile`

- **Description:** Fetches the profile information for the currently authenticated user.

### POST /servers/test- **Authentication:** Bearer Token required.

- desc: test MCP server connection- **Response (Success 200):**

- req: McpServerTest  ```json

- res: { status: "success", message: string }  {

- errors: 400, 401    "username": "terminal_user_01",

    "email": "user@example.com"

### GET /servers/{server_id}/status  }

- desc: get server connection status  ```

- req: none

- res: { status: "online" | "offline", latency?: number, last_checked: string }### 2.2 Change Password

- errors: 401, 404- **Endpoint:** `PUT /api/user/password`

- **Description:** Updates the password for the authenticated user.

### WebSocket /ws/server/{server_id}- **Authentication:** Bearer Token required.

- desc: real-time communication with MCP server- **Request Body:**

- auth: Bearer token in query param or header  ```json

- messages: see WebSocket Messages section below  {

    "currentPassword": "old_password",

## Models    "newPassword": "new_secure_password"

  }

### User  ```

- id: string- **Response (Success 200):**

- username: string  ```json

- email: string  {

- created_at: string    "success": true,

- updated_at: string    "message": "Password updated successfully."

  }

### McpServer  ```

- id: string

- name: string---

- url: string## 3. Server Management

- auth_method: "none" | "api_key" | "oauth"

- status: "online" | "offline" | "error"Handles connections to MCP servers.

- timeout: number

- ssl_verify: boolean### 3.1 Get Connected Servers

- created_at: string- **Endpoint:** `GET /api/servers`

- updated_at: string- **Description:** Retrieves a list of MCP servers the user has configured.

- **Authentication:** Bearer Token required.

### McpServerCreate- **Response (Success 200):**

- name: string  ```json

- url: string  [

- auth_method: "none" | "api_key" | "oauth"    {

- credentials?: object      "id": 1,

- timeout?: number (default: 30)      "name": "KALI-MCP-PROD",

- ssl_verify?: boolean (default: true)      "status": "online"

    },

### McpServerUpdate    {

- name?: string      "id": 2,

- url?: string      "name": "DEV-MCP-INSTANCE",

- auth_method?: "none" | "api_key" | "oauth"      "status": "offline"

- credentials?: object    }

- timeout?: number  ]

- ssl_verify?: boolean  ```



### McpServerTest### 3.2 Add New Server

- url: string- **Endpoint:** `POST /api/servers`

- auth_method: "none" | "api_key" | "oauth"- **Description:** Adds a new MCP server configuration for the user.

- credentials?: object- **Authentication:** Bearer Token required.

- timeout?: number- **Request Body:**

- ssl_verify?: boolean  ```json

  {

### OtpRequest    "serverName": "Production Server",

- email: string    "serverUrl": "https://api.example.com/mcp",

    "authMethod": "apiKey", 

### OtpVerify    "credentials": {

- email: string      "apiKey": "secret-api-key"

- code: string    },

- device_fingerprint?: string    "timeout": 30,

    "sslVerify": true

### TokenRefresh  }

- refresh_token: string  ```

- **Response (Success 201):**

## WebSocket Messages  ```json

  {

### Client-to-Server    "success": true,

```json    "server": {

{      "id": 3,

  "type": "chat_message",      "name": "Production Server",

  "payload": {      "status": "online" 

    "text": "Analyze the latest user signups."    }

  }  }

}  ```

```

### 3.3 Test Server Connection

```json- **Endpoint:** `POST /api/servers/test`

{- **Description:** Tests connection details for a potential new server without saving it.

  "type": "approve_task",- **Authentication:** Bearer Token required.

  "payload": {- **Request Body:** (Same as Add New Server)

    "node_id": "node1"- **Response (Success 200):**

  }  ```json

}  {

```    "success": true,

    "message": "Connection successful."

### Server-to-Client  }

```json  ```

{- **Response (Error 400/500):**

  "type": "connection_status",  ```json

  "payload": {  {

    "status": "online",    "success": false,

    "latency": 12,    "error": "Connection failed: Authentication error."

    "model": "mcp-server",  }

    "memory": { "used": 256, "total": 1024 }  ```

  }

}---

```## 4. Real-time Agent Communication (WebSocket)



```jsonHandles live interaction with a connected MCP server.

{

  "type": "chat_message",- **Endpoint:** `WS /ws/server/:id`

  "payload": {- **Description:** Establishes a WebSocket connection for a specific server session. The connection should be authenticated using the session token.

    "sender": "AGENT" | "USER" | "SYSTEM",

    "text": "Understood. Generating a task plan for your request.",### 4.1 Client-to-Server Messages

    "timestamp": "2025-10-02T22:30:05Z"- **Send Chat Message:**

  }  ```json

}  {

```    "type": "chat_message",

    "payload": {

```json      "text": "Analyze the latest user signups."

{    }

  "type": "task_graph_proposal",  }

  "payload": {  ```

    "nodes": [- **Approve Task Node:**

      {  ```json

        "id": "node1",  {

        "title": "Query User Database",    "type": "approve_task",

        "content": "...",    "payload": {

        "status": "pending",      "nodeId": "node1"

        "position": { "x": 100, "y": 200 }    }

      },  }

      {  ```

        "id": "node2",

        "title": "Fetch API Data",### 4.2 Server-to-Client Messages

        "content": "...",- **Connection & Status Update:**

        "status": "pending",  ```json

        "position": { "x": 300, "y": 200 },  {

        "depends_on": ["node1"]    "type": "connection_status",

      }    "payload": {

    ]      "status": "online",

  }      "latency": 12,

}      "model": "gemini-2.5-flash",

```      "memory": { "used": 256, "total": 1024 }

    }

```json  }

{  ```

  "type": "log_entry",- **System/Agent/User Message:**

  "payload": {  ```json

    "timestamp": "2025-10-02T22:30:05Z",  {

    "level": "info",    "type": "chat_message",

    "message": "Agent responded and proposed a plan."    "payload": {

  }      "sender": "AGENT",

}      "text": "Understood. Generating a task plan for your request.",

```      "timestamp": "10:30:05 PM"

    }

```json  }

{  ```

  "type": "artifact_generated",- **Task Graph Proposal:**

  "payload": {  ```json

    "name": "daily_report.pdf",  {

    "url": "/api/artifacts/download/report-xyz",    "type": "task_graph_proposal",

    "content_type": "application/pdf",    "payload": {

    "size": 1024      "nodes": [

  }        { "id": "node1", "title": "Query User Database", "content": "...", "status": "pending", "position": {...} },

}        { "id": "node2", "title": "Fetch API Data", "content": "...", "status": "pending", "position": {...}, "dependsOn": ["node1"] }

```      ]

    }

## Notes  }

- pagination: cursor-based preferred  ```

- rate-limit: 60 rpm per IP for auth endpoints, 120 rpm for others- **Live Log Entry:**

- otp: 6 digits, TTL 10 minutes, cooldown 30s, max 5 attempts per window, store **hashed** code with salted HMAC, single-use, bind to email + IP window  ```json

- jwt: access token 15m, refresh token 7d  {

- websocket auth: token in Authorization header or ?token= query param    "type": "log_entry",

- all timestamps in ISO 8601 format    "payload": {

- mcp server credentials encrypted at rest      "timestamp": "10:30:05 PM",
      "message": "Agent responded and proposed a plan."
    }
  }
  ```
- **Artifact Generated:**
  ```json
  {
    "type": "artifact_generated",
    "payload": {
      "name": "daily_report.pdf",
      "url": "/api/artifacts/download/report-xyz"
    }
  }
  ```
