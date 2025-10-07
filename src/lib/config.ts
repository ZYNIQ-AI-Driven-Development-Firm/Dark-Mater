/**
 * Centralized configuration for the Dark Matter MCP application.
 */

interface Config {
  // API Configuration
  apiBaseUrl: string;
  apiVersion: string;
  
  // WebSocket Configuration
  wsBaseUrl: string;
  
  // Authentication
  tokenKey: string;
  refreshTokenKey: string;
  
  // App Configuration
  appName: string;
  appVersion: string;
  
  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
  
  // Feature Flags
  features: {
    enableWebSocket: boolean;
    enableOTP: boolean;
    enableServerManagement: boolean;
  };
}

// Environment variables with defaults
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof window !== 'undefined') {
    // Browser environment - check runtime env first, then build-time env
    return (window as any)?.ENV?.[key] || (window as any)?.env?.[key] || defaultValue;
  }
  // Build time environment
  return (import.meta.env as any)?.[key] || defaultValue;
};

const isDev = getEnvVar('MODE') === 'development' || getEnvVar('NODE_ENV') === 'development';

export const config: Config = {
  // API Configuration
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', isDev ? 'http://localhost:8000' : ''),
  apiVersion: 'v1',
  
  // WebSocket Configuration  
  wsBaseUrl: getEnvVar('VITE_WS_BASE_URL', isDev ? 'ws://localhost:8000' : ''),
  
  // Authentication
  tokenKey: 'dark_matter_access_token',
  refreshTokenKey: 'dark_matter_refresh_token',
  
  // App Configuration
  appName: 'Dark Matter MCP',
  appVersion: '1.0.0',
  
  // Environment
  isDevelopment: isDev,
  isProduction: !isDev,
  
  // Feature Flags
  features: {
    enableWebSocket: true,
    enableOTP: true,
    enableServerManagement: true,
  },
};

// API Endpoints
export const endpoints = {
  // Health
  health: '/healthz',
  
  // Auth
  auth: {
    otpRequest: `/api/${config.apiVersion}/auth/otp/request`,
    otpVerify: `/api/${config.apiVersion}/auth/otp/verify`,
    refresh: `/api/${config.apiVersion}/auth/refresh`,
    logout: `/api/${config.apiVersion}/auth/logout`,
  },
  
  // User
  user: {
    profile: `/api/${config.apiVersion}/user/profile`,
    delete: `/api/${config.apiVersion}/user/delete`,
    cancelDeletion: `/api/${config.apiVersion}/user/cancel-deletion`,
  },
  
  // Servers
  servers: {
    list: `/api/${config.apiVersion}/servers`,
    create: `/api/${config.apiVersion}/servers`,
    update: (id: string) => `/api/${config.apiVersion}/servers/${id}`,
    delete: (id: string) => `/api/${config.apiVersion}/servers/${id}`,
    test: `/api/${config.apiVersion}/servers/test`,
    status: (id: string) => `/api/${config.apiVersion}/servers/${id}/status`,
    enroll: `/api/${config.apiVersion}/servers/enroll`,
  },
  
  // WebSocket
  websocket: {
    server: (id: string) => `/ws/server/${id}`,
  },
};

// Utility functions
export const getApiUrl = (endpoint: string): string => {
  return `${config.apiBaseUrl}${endpoint}`;
};

export const getWsUrl = (endpoint: string): string => {
  return `${config.wsBaseUrl}${endpoint}`;
};

// Storage utilities
export const storage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(config.tokenKey);
    console.log(`🔍 storage.getToken() using key "${config.tokenKey}":`, token ? 'Found' : 'Missing');
    return token;
  },
  
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(config.tokenKey, token);
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(config.refreshTokenKey);
  },
  
  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(config.refreshTokenKey, token);
  },
  
  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.refreshTokenKey);
  },
  
  setTokens: (accessToken: string, refreshToken: string): void => {
    storage.setToken(accessToken);
    storage.setRefreshToken(refreshToken);
  },
};

export default config;