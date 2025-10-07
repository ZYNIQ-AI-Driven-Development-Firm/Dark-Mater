/**
 * Security configuration and utilities for the frontend application.
 */

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite dev mode
    'https://cdn.tailwindcss.com',
    'https://esm.sh',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and Tailwind
    'https://fonts.googleapis.com',
    'https://cdn.tailwindcss.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://raw.githubusercontent.com',
  ],
  'connect-src': [
    "'self'",
    'ws://localhost:8000', // WebSocket dev
    'wss://localhost:8000', // WebSocket dev SSL
    'http://localhost:8000', // API dev
    'https://localhost:8000', // API dev SSL
    process.env.NODE_ENV === 'production' ? 'wss://api.darkmater.app' : '',
    process.env.NODE_ENV === 'production' ? 'https://api.darkmater.app' : '',
  ].filter(Boolean),
  'frame-ancestors': ["'none'"], // Prevent embedding in frames
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Token security configuration
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  // Use sessionStorage for sensitive data, localStorage for less sensitive
  STORAGE_TYPE: 'localStorage' as 'localStorage' | 'sessionStorage',
  // Token refresh buffer (refresh 1 minute before expiry)
  REFRESH_BUFFER_MS: 60 * 1000,
};

// Input validation and sanitization
export const VALIDATION_CONFIG = {
  // Email validation
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Server name validation (alphanumeric, spaces, hyphens, underscores)
  SERVER_NAME_REGEX: /^[a-zA-Z0-9\s\-_]{1,100}$/,
  // URL validation (basic)
  URL_REGEX: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  // Maximum input lengths
  MAX_EMAIL_LENGTH: 254,
  MAX_SERVER_NAME_LENGTH: 100,
  MAX_URL_LENGTH: 2048,
  MAX_API_KEY_LENGTH: 500,
  MAX_MESSAGE_LENGTH: 5000,
};

// Rate limiting configuration (client-side)
export const RATE_LIMIT_CONFIG = {
  // OTP requests per hour
  OTP_REQUESTS_PER_HOUR: 5,
  // Server test connections per minute
  TEST_CONNECTIONS_PER_MINUTE: 10,
  // Chat messages per minute
  CHAT_MESSAGES_PER_MINUTE: 60,
};

// XSS Protection utility
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  if (email.length > VALIDATION_CONFIG.MAX_EMAIL_LENGTH) return false;
  return VALIDATION_CONFIG.EMAIL_REGEX.test(email);
};

// Validate server name
export const isValidServerName = (name: string): boolean => {
  if (name.length > VALIDATION_CONFIG.MAX_SERVER_NAME_LENGTH) return false;
  return VALIDATION_CONFIG.SERVER_NAME_REGEX.test(name);
};

// Validate URL
export const isValidUrl = (url: string): boolean => {
  if (url.length > VALIDATION_CONFIG.MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Generate device fingerprint for additional security
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
};

// Security event logging
export const logSecurityEvent = (event: string, details?: Record<string, any>) => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...details,
  };
  
  console.warn('[SECURITY]', logData);
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to security monitoring service
  }
};

// JWT token validation (basic client-side check)
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Check if token expires within the refresh buffer
    return now >= (exp - TOKEN_CONFIG.REFRESH_BUFFER_MS);
  } catch {
    return true;
  }
};

// Secure storage wrapper
export const secureStorage = {
  setItem: (key: string, value: string, sensitive = false) => {
    try {
      const storage = sensitive ? sessionStorage : localStorage;
      storage.setItem(key, value);
    } catch (error) {
      logSecurityEvent('storage_error', { key, error: String(error) });
    }
  },
  
  getItem: (key: string, sensitive = false): string | null => {
    try {
      const storage = sensitive ? sessionStorage : localStorage;
      return storage.getItem(key);
    } catch (error) {
      logSecurityEvent('storage_error', { key, error: String(error) });
      return null;
    }
  },
  
  removeItem: (key: string, sensitive = false) => {
    try {
      const storage = sensitive ? sessionStorage : localStorage;
      storage.removeItem(key);
    } catch (error) {
      logSecurityEvent('storage_error', { key, error: String(error) });
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      logSecurityEvent('storage_error', { error: String(error) });
    }
  },
};

// Network security utilities
export const isSecureConnection = (): boolean => {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

export const enforceSecureConnection = () => {
  if (process.env.NODE_ENV === 'production' && !isSecureConnection()) {
    logSecurityEvent('insecure_connection_detected');
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};

// Initialize security measures
export const initializeSecurity = () => {
  // Enforce HTTPS in production
  enforceSecureConnection();
  
  // Disable right-click context menu in production
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Log security events
  logSecurityEvent('security_initialized', {
    environment: process.env.NODE_ENV,
    isSecure: isSecureConnection(),
    timestamp: new Date().toISOString(),
  });
};

export default {
  CSP_CONFIG,
  SECURITY_HEADERS,
  TOKEN_CONFIG,
  VALIDATION_CONFIG,
  RATE_LIMIT_CONFIG,
  sanitizeInput,
  isValidEmail,
  isValidServerName,
  isValidUrl,
  generateDeviceFingerprint,
  logSecurityEvent,
  isTokenExpired,
  secureStorage,
  isSecureConnection,
  enforceSecureConnection,
  initializeSecurity,
};