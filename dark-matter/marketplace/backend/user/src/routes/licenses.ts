import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../server';
import { LicenseStatus } from '@prisma/client';

const router = Router();

/**
 * POST /licenses/activate - Activate a license token
 */
router.post('/activate',
  [
    body('orderId').isUUID(),
    body('listingId').isUUID(),
    body('scope').isObject(),
    body('scope.tenants').isArray(),
    body('scope.labs').isArray(),
    body('scope.durationMin').isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const { orderId, listingId, scope } = req.body;

      // Verify order belongs to user and is completed
      const order = await prisma.marketplaceOrder.findFirst({
        where: {
          id: orderId,
          userId,
          status: 'COMPLETED'
        },
        include: {
          items: {
            where: { listingId }
          }
        }
      });

      if (!order || order.items.length === 0) {
        return res.status(404).json({ error: 'Order or listing not found' });
      }

      // Get listing details for manifest
      const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Calculate license expiry
      const now = new Date();
      const endAt = new Date(now.getTime() + scope.durationMin * 60 * 1000);

      // Create license token payload
      const tokenPayload = {
        sub: userId,
        listingId,
        type: listing.type.toLowerCase(),
        scope: {
          tenants: scope.tenants || ['default'],
          labs: scope.labs || ['*'],
          durationMin: scope.durationMin
        },
        manifest: listing.manifestJson,
        exp: Math.floor(endAt.getTime() / 1000),
        iat: Math.floor(now.getTime() / 1000),
        iss: process.env.LICENSE_ISSUER || 'marketplace.darkmatter.local'
      };

      // Sign the token
      const signingKey = process.env.LICENSE_SIGNING_KEY!;
      const tokenJws = jwt.sign(tokenPayload, signingKey, { algorithm: 'HS256' });

      // Store license in database
      const license = await prisma.marketplaceLicense.create({
        data: {
          id: uuidv4(),
          userId,
          orderId,
          listingId,
          scopeJson: scope,
          status: LicenseStatus.ACTIVE,
          tokenJws,
          startAt: now,
          endAt,
          maxUsage: scope.maxUsage || null
        }
      });

      res.json({
        licenseId: license.id,
        token: tokenJws,
        expiresAt: endAt.toISOString(),
        scope: tokenPayload.scope
      });

    } catch (error) {
      console.error('License activation error:', error);
      res.status(500).json({ error: 'Failed to activate license' });
    }
  }
);

/**
 * GET /licenses/:id - Get license status
 */
router.get('/:id',
  [param('id').isUUID()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const { id } = req.params;

      const license = await prisma.marketplaceLicense.findFirst({
        where: {
          id,
          userId
        },
        include: {
          listing: {
            select: {
              title: true,
              type: true
            }
          }
        }
      });

      if (!license) {
        return res.status(404).json({ error: 'License not found' });
      }

      // Check if license is expired
      const now = new Date();
      const isExpired = license.endAt && license.endAt < now;
      const isUsageLimitReached = license.maxUsage && license.usageCount >= license.maxUsage;

      let status = license.status;
      if (isExpired || isUsageLimitReached) {
        status = LicenseStatus.EXPIRED;
        
        // Update status in database if needed
        if (license.status === LicenseStatus.ACTIVE) {
          await prisma.marketplaceLicense.update({
            where: { id },
            data: { status: LicenseStatus.EXPIRED }
          });
        }
      }

      res.json({
        id: license.id,
        status,
        listing: license.listing,
        scope: license.scopeJson,
        startAt: license.startAt,
        endAt: license.endAt,
        usageCount: license.usageCount,
        maxUsage: license.maxUsage,
        isExpired,
        isUsageLimitReached
      });

    } catch (error) {
      console.error('License fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch license' });
    }
  }
);

/**
 * GET /licenses - Get user's licenses
 */
router.get('/',
  [
    query('status').optional().isIn(['ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED']),
    query('type').optional().isIn(['agent', 'team', 'tool', 'plugin']),
    query('page').optional().isInt({ min: 1 }).default(1),
    query('limit').optional().isInt({ min: 1, max: 50 }).default(20)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const { status, type, page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      
      if (status) {
        where.status = status;
      }

      if (type) {
        where.listing = {
          type: type.toUpperCase()
        };
      }

      const [licenses, total] = await Promise.all([
        prisma.marketplaceLicense.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            listing: {
              select: {
                title: true,
                type: true,
                summary: true
              }
            }
          }
        }),
        prisma.marketplaceLicense.count({ where })
      ]);

      const hasMore = skip + limit < total;

      res.json({
        licenses,
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      });

    } catch (error) {
      console.error('Licenses fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch licenses' });
    }
  }
);

/**
 * POST /licenses/:id/usage - Track license usage
 */
router.post('/:id/usage',
  [
    param('id').isUUID(),
    body('increment').optional().isInt({ min: 1 }).default(1),
    body('context').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const { id } = req.params;
      const { increment = 1 } = req.body;

      const license = await prisma.marketplaceLicense.findFirst({
        where: {
          id,
          userId,
          status: LicenseStatus.ACTIVE
        }
      });

      if (!license) {
        return res.status(404).json({ error: 'Active license not found' });
      }

      // Check if usage would exceed limit
      if (license.maxUsage && license.usageCount + increment > license.maxUsage) {
        return res.status(409).json({ 
          error: 'Usage limit would be exceeded',
          currentUsage: license.usageCount,
          maxUsage: license.maxUsage
        });
      }

      // Update usage count
      const updatedLicense = await prisma.marketplaceLicense.update({
        where: { id },
        data: {
          usageCount: { increment }
        }
      });

      res.json({
        usageCount: updatedLicense.usageCount,
        maxUsage: updatedLicense.maxUsage,
        remaining: updatedLicense.maxUsage ? updatedLicense.maxUsage - updatedLicense.usageCount : null
      });

    } catch (error) {
      console.error('License usage tracking error:', error);
      res.status(500).json({ error: 'Failed to track license usage' });
    }
  }
);

/**
 * POST /licenses/verify - Verify license token (for external services)
 */
router.post('/verify',
  [body('token').isString().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.body;
      const signingKey = process.env.LICENSE_SIGNING_KEY!;

      // Verify JWT signature and decode
      const decoded = jwt.verify(token, signingKey) as any;

      // Check if license exists and is active
      const license = await prisma.marketplaceLicense.findFirst({
        where: {
          tokenJws: token,
          status: LicenseStatus.ACTIVE
        },
        include: {
          listing: {
            select: {
              title: true,
              type: true,
              manifestJson: true
            }
          }
        }
      });

      if (!license) {
        return res.status(404).json({ 
          valid: false, 
          error: 'License not found or inactive' 
        });
      }

      // Check expiry
      const now = new Date();
      if (license.endAt && license.endAt < now) {
        return res.status(410).json({ 
          valid: false, 
          error: 'License expired' 
        });
      }

      // Check usage limits
      if (license.maxUsage && license.usageCount >= license.maxUsage) {
        return res.status(409).json({ 
          valid: false, 
          error: 'Usage limit exceeded' 
        });
      }

      res.json({
        valid: true,
        license: {
          id: license.id,
          userId: license.userId,
          type: license.listing.type,
          scope: license.scopeJson,
          manifest: license.listing.manifestJson,
          usageCount: license.usageCount,
          maxUsage: license.maxUsage,
          expiresAt: license.endAt
        }
      });

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          valid: false, 
          error: 'Invalid token signature' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(410).json({ 
          valid: false, 
          error: 'Token expired' 
        });
      }

      console.error('License verification error:', error);
      res.status(500).json({ 
        valid: false, 
        error: 'Failed to verify license' 
      });
    }
  }
);

export default router;