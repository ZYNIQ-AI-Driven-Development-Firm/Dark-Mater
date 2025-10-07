import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from './auth';

/**
 * Audit middleware that logs all user actions
 */
export const auditMiddleware = (prisma: PrismaClient) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    const startTime = Date.now();

    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody: any = null;
    let responseStatus = 200;

    // Override response methods to capture response data
    res.send = function(data) {
      responseBody = data;
      responseStatus = res.statusCode;
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      responseBody = data;
      responseStatus = res.statusCode;
      return originalJson.call(this, data);
    };

    // Continue to next middleware
    next();

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const action = `${req.method.toLowerCase()}.${req.path.replace(/^\//, '').replace(/\//g, '.')}`;

        // Determine if this action should be audited
        const auditableActions = [
          'post', 'put', 'patch', 'delete', // All mutations
          'get.admin', 'get.vendor' // Admin/vendor views
        ];

        const shouldAudit = auditableActions.some(prefix => 
          action.startsWith(prefix) || action.includes('.admin.') || action.includes('.vendor.')
        );

        if (shouldAudit && user) {
          const details: any = {
            method: req.method,
            path: req.path,
            query: req.query,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            duration,
            status: responseStatus
          };

          // Include request body for mutations (but filter sensitive data)
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const sensitiveFields = ['password', 'token', 'secret', 'key'];
            const filteredBody = { ...req.body };
            
            for (const field of sensitiveFields) {
              if (filteredBody[field]) {
                filteredBody[field] = '[REDACTED]';
              }
            }
            
            details.requestBody = filteredBody;
          }

          // Include response for successful operations
          if (responseStatus < 400 && responseBody) {
            // Limit response size to prevent huge audit logs
            const responseStr = JSON.stringify(responseBody);
            details.response = responseStr.length > 1000 
              ? responseStr.substring(0, 1000) + '...[TRUNCATED]'
              : responseBody;
          }

          // Include error details for failed operations
          if (responseStatus >= 400 && responseBody) {
            details.error = responseBody;
          }

          await prisma.auditLog.create({
            data: {
              id: uuidv4(),
              userId: user.id,
              action,
              resourceType: getResourceType(req.path),
              resourceId: extractResourceId(req.path, req.body),
              details,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            }
          });
        }
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't fail the request if audit logging fails
      }
    });
  };
};

/**
 * Extract resource type from request path
 */
function getResourceType(path: string): string {
  const segments = path.split('/').filter(Boolean);
  
  if (segments.includes('catalog')) return 'marketplace_listing';
  if (segments.includes('cart')) return 'cart';
  if (segments.includes('orders')) return 'marketplace_order';
  if (segments.includes('licenses')) return 'marketplace_license';
  if (segments.includes('admin')) return 'admin_action';
  if (segments.includes('vendor')) return 'vendor_action';
  
  return 'unknown';
}

/**
 * Extract resource ID from request path or body
 */
function extractResourceId(path: string, body?: any): string | null {
  // Try to extract UUID from path
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const pathMatch = path.match(uuidRegex);
  
  if (pathMatch) {
    return pathMatch[0];
  }

  // Try to extract from common body fields
  if (body) {
    const idFields = ['id', 'listingId', 'orderId', 'licenseId'];
    for (const field of idFields) {
      if (body[field] && typeof body[field] === 'string') {
        return body[field];
      }
    }
  }

  return null;
}