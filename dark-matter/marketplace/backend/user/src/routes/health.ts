import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

/**
 * GET /health - Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'marketplace-user-api',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'healthy',
        memory: {
          usage: process.memoryUsage(),
          limit: process.env.MEMORY_LIMIT || 'unlimited'
        },
        uptime: process.uptime()
      }
    };

    res.json(status);
  } catch (error) {
    const status = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'marketplace-user-api',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'unhealthy',
        memory: {
          usage: process.memoryUsage(),
          limit: process.env.MEMORY_LIMIT || 'unlimited'
        },
        uptime: process.uptime()
      },
      error: error.message
    };

    res.status(503).json(status);
  }
});

/**
 * GET /health/ready - Readiness probe
 */
router.get('/ready', async (req, res) => {
  try {
    // Check all critical dependencies
    await prisma.$queryRaw`SELECT 1`;
    
    // Add any other readiness checks here
    // e.g., external service dependencies
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /health/live - Liveness probe
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;