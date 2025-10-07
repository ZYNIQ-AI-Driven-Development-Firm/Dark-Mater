/**
 * API utility functions for Dark Matter MCP
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_new_user: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface OtpRequestResponse {
  status: string;
  cooldown_sec: number;
  dev_otp?: string; // Only in development mode
}

export class ApiClient {
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('dark_matter_access_token') || localStorage.getItem('access_token');
    console.log('[AUTH] Getting auth headers, token:', token ? 'Found' : 'Missing');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Authentication methods
  static async requestOtp(email: string): Promise<OtpRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to request OTP');
    }

    return response.json();
  }

  static async verifyOtp(email: string, code: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to verify OTP');
    }

    const data = await response.json();
    
    // Store tokens using consistent keys
    localStorage.setItem('dark_matter_access_token', data.access_token);
    localStorage.setItem('dark_matter_refresh_token', data.refresh_token);
    // Also store with old keys for backward compatibility
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  }

  static async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('dark_matter_refresh_token') || localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          console.warn('Server logout failed, but continuing with client logout');
        }
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }
    }

    // Always clear local storage (both old and new keys)
    localStorage.removeItem('dark_matter_access_token');
    localStorage.removeItem('dark_matter_refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  static async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      return true;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      return false;
    }
  }

  // Server management methods
  static async getServers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/servers`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch servers');
    }

    const data = await response.json();
    return data.servers || [];
  }

  static async createServer(serverData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/servers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(serverData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create server');
    }

    return response.json();
  }

  static async updateServer(serverId: string, serverData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(serverData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update server');
    }

    return response.json();
  }

  static async deleteServer(serverId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete server');
    }
  }

  static async testServerConnection(serverData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/servers/test`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(serverData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to test server connection');
    }

    return response.json();
  }

  static async getServerStatus(serverId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/status`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get server status');
    }

    return response.json();
  }

  // User profile methods
  static async getUserProfile(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user profile');
    }

    return response.json();
  }

  static async updateUserProfile(profileData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update user profile');
    }

    return response.json();
  }

  // Chat methods
  static async getAvailableModels(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/chat/models`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get available models');
    }

    return response.json();
  }

  static async pullModel(modelName: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/chat/models/${modelName}/pull`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to pull model');
    }

    return response.json();
  }

  static async sendChatMessage(serverId: string, message: string, model: string = 'llama2'): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/chat/servers/${serverId}/chat`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        message,
        model,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send chat message');
    }

    return response.json();
  }

  static async clearChatHistory(serverId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/servers/${serverId}/chat`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to clear chat history');
    }
  }

  // WebSocket connections
  static createServerWebSocket(serverId: string): WebSocket {
    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://localhost:8000/ws/server/${serverId}${token ? `?token=${token}` : ''}`;
    return new WebSocket(wsUrl);
  }

  static createChatWebSocket(serverId: string): WebSocket {
    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://localhost:8000/ws/chat/${serverId}${token ? `?token=${token}` : ''}`;
    return new WebSocket(wsUrl);
  }

  // Health check
  static async healthCheck(): Promise<any> {
    const response = await fetch('http://localhost:8000/healthz');
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }

  // Kali MCP Server methods
  static async enrollKaliServer(enrollmentData: {
    name: string;
    host: string;
    port: number;
    enrollment_id: string;
    enrollment_token: string;
    ssl_verify: boolean;
  }): Promise<any> {
    // Get fresh token from localStorage
    const token = localStorage.getItem('dark_matter_access_token') || localStorage.getItem('access_token');
    
    // === CRITICAL CHECK ===
    if (!token) {
      const errorMessage = "FATAL: No authentication token found in localStorage. Cannot enroll server. Please log out and log back in.";
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('[AUTH] Enrolling Kali server, token:', token ? `Found: ${token.substring(0, 50)}...` : 'Missing');
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // No longer conditional, we know it exists
    };
    
    console.log('[REQUEST] Request headers:', JSON.stringify(headers, null, 2));
    console.log('[REQUEST] Full URL:', `${API_BASE_URL}/servers/enroll`);
    console.log('[REQUEST] Request body:', JSON.stringify(enrollmentData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/servers/enroll`, {
      method: 'POST',
      headers,
      body: JSON.stringify(enrollmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to enroll Kali server');
    }

    return response.json();
  }

  static async getServerTools(serverId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/tools`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get server tools');
    }

    return response.json();
  }

  static async executeServerTool(serverId: string, toolData: {
    name: string;
    arguments: Record<string, any>;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/tools/execute`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(toolData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to execute tool');
    }

    return response.json();
  }

  static async getServerArtifacts(serverId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/artifacts?limit=${limit}&offset=${offset}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get server artifacts');
    }

    return response.json();
  }

  static async readArtifact(serverId: string, artifactUri: string): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/artifacts/read?uri=${encodeURIComponent(artifactUri)}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to read artifact');
    }

    return response;
  }

  static async getNgrokInfo(serverId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/ngrok`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get Ngrok info');
    }

    return response.json();
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Get user info from token (basic decode)
  static getUserInfo(): any | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.sub,
        exp: payload.exp,
      };
    } catch (error) {
      return null;
    }
  }
}