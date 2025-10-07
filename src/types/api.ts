// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Authentication Types
export interface OtpRequestResponse {
  success: boolean;
  message: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

// Server Types
export interface McpServer {
  id: string;
  name: string;
  url: string;
  auth_method: 'none' | 'api_key' | 'oauth' | 'enrollment' | 'jwt';
  credentials?: Record<string, any>;
  timeout: number;
  ssl_verify: boolean;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateServerRequest {
  name: string;
  url: string;
  auth_method: 'none' | 'api_key' | 'oauth' | 'enrollment' | 'jwt';
  credentials?: Record<string, any>;
  timeout?: number;
  ssl_verify?: boolean;
}

export interface UpdateServerRequest {
  name?: string;
  url?: string;
  auth_method?: 'none' | 'api_key' | 'oauth' | 'enrollment' | 'jwt';
  credentials?: Record<string, any>;
  timeout?: number;
  ssl_verify?: boolean;
}

export interface ServerTestRequest {
  url: string;
  auth_method: 'none' | 'api_key' | 'oauth' | 'enrollment' | 'jwt';
  credentials?: Record<string, any>;
  timeout?: number;
  ssl_verify?: boolean;
}

export interface ServerTestResponse {
  success: boolean;
  message: string;
  latency_ms?: number;
  server_info?: Record<string, any>;
}

export interface ServerStatusResponse {
  status: 'active' | 'inactive' | 'error';
  last_ping?: string;
  latency_ms?: number;
  error_message?: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'message' | 'error' | 'connection' | 'status';
  data: any;
  server_id?: string;
  timestamp: string;
}

export interface WebSocketConnection {
  server_id: string;
  status: 'connected' | 'disconnected' | 'error';
  last_activity?: string;
}