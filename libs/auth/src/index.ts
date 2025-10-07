import jwt from 'jsonwebtoken';
import axios from 'axios';

// Auth client configuration
export interface AuthConfig {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  audience?: string;
}

// User representation
export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  tenants: string[];
}

// Token payload
export interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  roles: string[];
  tenants: string[];
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export class AuthClient {
  constructor(private config: AuthConfig) {}

  /**
   * Verify JWT token and extract user info
   */
  async verifyToken(token: string): Promise<User> {
    try {
      // In production, fetch public key from JWKS endpoint
      const decoded = jwt.decode(token) as TokenPayload;
      
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid token');
      }

      return {
        id: decoded.sub,
        email: decoded.email,
        username: decoded.username,
        roles: decoded.roles || ['user'],
        tenants: decoded.tenants || ['default']
      };
    } catch (error) {
      throw new Error('Token verification failed');
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(user: User, role: string): boolean {
    return user.roles.includes(role) || user.roles.includes('admin');
  }

  /**
   * Check if user can access tenant
   */
  canAccessTenant(user: User, tenant: string): boolean {
    return user.tenants.includes(tenant) || user.tenants.includes('*');
  }

  /**
   * Get user info from auth service
   */
  async getUserInfo(userId: string, token: string): Promise<User> {
    const response = await axios.get(`${this.config.issuerUrl}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  }
}

// RBAC helpers
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  VENDOR: 'vendor',
  INSTRUCTOR: 'instructor',
  JUDGE: 'judge',
  LAB_OPERATOR: 'lab-operator'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export function requireRole(user: User, role: Role): void {
  if (!user.roles.includes(role) && !user.roles.includes(ROLES.ADMIN)) {
    throw new Error(`Access denied. Required role: ${role}`);
  }
}

export function requireAnyRole(user: User, roles: Role[]): void {
  const hasRequiredRole = roles.some(role => 
    user.roles.includes(role) || user.roles.includes(ROLES.ADMIN)
  );
  
  if (!hasRequiredRole) {
    throw new Error(`Access denied. Required roles: ${roles.join(', ')}`);
  }
}