import { Request, Response, NextFunction } from 'express';

/**
 * Feature gate middleware to check if marketplace is enabled
 */
export const featureGateMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if marketplace feature is enabled
  const marketplaceEnabled = process.env.FEATURE_MARKETPLACE_ENABLED !== 'false';
  
  if (!marketplaceEnabled) {
    return res.status(503).json({
      error: 'Marketplace service is currently unavailable',
      code: 'FEATURE_DISABLED'
    });
  }

  // Check for maintenance mode
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  if (maintenanceMode) {
    return res.status(503).json({
      error: 'Marketplace is temporarily down for maintenance',
      code: 'MAINTENANCE_MODE',
      retryAfter: process.env.MAINTENANCE_RETRY_AFTER || '3600' // 1 hour default
    });
  }

  next();
};

/**
 * Feature flag middleware for specific features
 */
export const featureFlag = (featureName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const envKey = `FEATURE_${featureName.toUpperCase()}_ENABLED`;
    const featureEnabled = process.env[envKey] !== 'false';
    
    if (!featureEnabled) {
      return res.status(501).json({
        error: `Feature '${featureName}' is not available`,
        code: 'FEATURE_NOT_IMPLEMENTED'
      });
    }

    next();
  };
};

/**
 * Beta feature middleware with user allowlist
 */
export const betaFeature = (featureName: string, allowedUsers?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const envKey = `FEATURE_${featureName.toUpperCase()}_BETA`;
    const betaEnabled = process.env[envKey] === 'true';
    
    if (!betaEnabled) {
      return res.status(501).json({
        error: `Beta feature '${featureName}' is not available`,
        code: 'BETA_FEATURE_DISABLED'
      });
    }

    // Check user allowlist if provided
    if (allowedUsers && allowedUsers.length > 0) {
      const user = (req as any).user;
      
      if (!user || !allowedUsers.includes(user.email)) {
        return res.status(403).json({
          error: `Beta feature '${featureName}' is not available for your account`,
          code: 'BETA_FEATURE_NOT_ALLOWED'
        });
      }
    }

    next();
  };
};