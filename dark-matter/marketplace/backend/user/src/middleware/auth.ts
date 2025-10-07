import { Request, Response, NextFunction } from 'express';
import { AuthClient } from '@dark-matter/auth';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name?: string;
    roles: string[];
    tenantId?: string;
  };
}

/**
 * Authentication middleware that validates JWT token
 */
export const authMiddleware = (authClient: AuthClient) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify token with auth service
      const user = await authClient.verifyToken(token);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles || [],
        tenantId: user.tenantId
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
};

/**
 * Role-based access control middleware
 */
export const requireRole = (requiredRoles: string | string[]) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRequiredRole = roles.some(role => user.roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles: roles,
        userRoles: user.roles
      });
    }

    next();
  };
};

/**
 * Tenant isolation middleware
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!user.tenantId) {
    return res.status(403).json({ error: 'Tenant access required' });
  }

  next();
};