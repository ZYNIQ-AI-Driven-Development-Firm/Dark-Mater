import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../server';
import { ListingStatus, OrderStatus, LicenseStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Middleware to ensure admin/vendor role
const requireAdminOrVendor = (req: any, res: any, next: any) => {
  const userRoles = req.user.roles || [];
  
  if (!userRoles.includes('admin') && !userRoles.includes('vendor')) {
    return res.status(403).json({ error: 'Admin or vendor role required' });
  }
  
  next();
};

/**
 * GET /admin/dashboard - Get admin dashboard stats
 */
router.get('/dashboard', requireAdminOrVendor, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.roles?.includes('admin');
    
    // For vendors, filter by their listings
    const vendorFilter = isAdmin ? {} : { vendorId: userId };

    const [
      totalListings,
      activeListings,
      totalOrders,
      completedOrders,
      totalRevenue,
      activeLicenses,
      recentOrders
    ] = await Promise.all([
      prisma.marketplaceListing.count({ where: vendorFilter }),
      prisma.marketplaceListing.count({ 
        where: { ...vendorFilter, status: ListingStatus.ACTIVE } 
      }),
      prisma.marketplaceOrder.count({ 
        where: isAdmin ? {} : { 
          items: { some: { listing: vendorFilter } }
        }
      }),
      prisma.marketplaceOrder.count({ 
        where: { 
          status: OrderStatus.COMPLETED,
          ...(isAdmin ? {} : { 
            items: { some: { listing: vendorFilter } }
          })
        }
      }),
      prisma.marketplaceOrder.aggregate({
        _sum: { totalAmount: true },
        where: { 
          status: OrderStatus.COMPLETED,
          ...(isAdmin ? {} : { 
            items: { some: { listing: vendorFilter } }
          })
        }
      }),
      prisma.marketplaceLicense.count({ 
        where: { 
          status: LicenseStatus.ACTIVE,
          ...(isAdmin ? {} : { listing: vendorFilter })
        }
      }),
      prisma.marketplaceOrder.findMany({
        where: isAdmin ? {} : { 
          items: { some: { listing: vendorFilter } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { email: true, name: true }
          },
          items: {
            include: {
              listing: {
                select: { title: true, type: true }
              }
            }
          }
        }
      })
    ]);

    res.json({
      stats: {
        totalListings,
        activeListings,
        totalOrders,
        completedOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        activeLicenses
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        user: order.user,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          title: item.listing.title,
          type: item.listing.type,
          quantity: item.quantity,
          price: item.price
        }))
      }))
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /admin/listings - Get listings for management
 */
router.get('/listings', requireAdminOrVendor,
  [
    query('status').optional().isIn(['DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED']),
    query('type').optional().isIn(['AGENT', 'TEAM', 'TOOL', 'PLUGIN']),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }).default(1),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(20)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const isAdmin = req.user.roles?.includes('admin');
      const { status, type, search, page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      // Vendors can only see their own listings
      if (!isAdmin) {
        where.vendorId = userId;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (type) {
        where.type = type;
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ];
      }

      const [listings, total] = await Promise.all([
        prisma.marketplaceListing.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
          include: {
            vendor: {
              select: { name: true, email: true }
            },
            _count: {
              select: { 
                orders: true,
                licenses: true
              }
            }
          }
        }),
        prisma.marketplaceListing.count({ where })
      ]);

      const hasMore = skip + limit < total;

      res.json({
        listings: listings.map(listing => ({
          id: listing.id,
          title: listing.title,
          type: listing.type,
          status: listing.status,
          price: listing.price,
          vendor: listing.vendor,
          createdAt: listing.createdAt,
          updatedAt: listing.updatedAt,
          stats: {
            orders: listing._count.orders,
            licenses: listing._count.licenses
          }
        })),
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      });

    } catch (error) {
      console.error('Admin listings fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  }
);

/**
 * PATCH /admin/listings/:id - Update listing status
 */
router.patch('/listings/:id',
  [
    param('id').isUUID(),
    body('status').isIn(['DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED']),
    body('reason').optional().isString()
  ],
  requireAdminOrVendor,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const isAdmin = req.user.roles?.includes('admin');
      const { id } = req.params;
      const { status, reason } = req.body;

      const where: any = { id };
      
      // Vendors can only update their own listings
      if (!isAdmin) {
        where.vendorId = userId;
      }

      const listing = await prisma.marketplaceListing.findUnique({
        where,
        include: {
          vendor: {
            select: { name: true, email: true }
          }
        }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      const updatedListing = await prisma.marketplaceListing.update({
        where: { id },
        data: {
          status: status as ListingStatus,
          reviewReason: reason || null,
          reviewedAt: new Date(),
          reviewedBy: userId
        }
      });

      // Log the status change
      await prisma.auditLog.create({
        data: {
          id: uuidv4(),
          userId,
          action: 'listing.status_changed',
          resourceType: 'marketplace_listing',
          resourceId: id,
          details: {
            previousStatus: listing.status,
            newStatus: status,
            reason
          }
        }
      });

      res.json({
        id: updatedListing.id,
        status: updatedListing.status,
        reviewReason: updatedListing.reviewReason,
        reviewedAt: updatedListing.reviewedAt
      });

    } catch (error) {
      console.error('Listing status update error:', error);
      res.status(500).json({ error: 'Failed to update listing status' });
    }
  }
);

/**
 * GET /admin/orders - Get orders for management
 */
router.get('/orders', requireAdminOrVendor,
  [
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']),
    query('userId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }).default(1),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(20)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const isAdmin = req.user.roles?.includes('admin');
      const { status, userId: filterUserId, page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (filterUserId) {
        where.userId = filterUserId;
      }

      // For vendors, filter by orders containing their listings
      if (!isAdmin) {
        where.items = {
          some: {
            listing: {
              vendorId: userId
            }
          }
        };
      }

      const [orders, total] = await Promise.all([
        prisma.marketplaceOrder.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: { name: true, email: true }
            },
            items: {
              include: {
                listing: {
                  select: { title: true, type: true, vendorId: true }
                }
              }
            }
          }
        }),
        prisma.marketplaceOrder.count({ where })
      ]);

      const hasMore = skip + limit < total;

      res.json({
        orders: orders.map(order => ({
          id: order.id,
          user: order.user,
          status: order.status,
          totalAmount: order.totalAmount,
          paymentIntent: order.paymentIntent,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: order.items.filter(item => 
            isAdmin || item.listing.vendorId === userId
          ).map(item => ({
            title: item.listing.title,
            type: item.listing.type,
            quantity: item.quantity,
            price: item.price
          }))
        })),
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      });

    } catch (error) {
      console.error('Admin orders fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }
);

/**
 * GET /admin/licenses - Get licenses for management
 */
router.get('/licenses', requireAdminOrVendor,
  [
    query('status').optional().isIn(['ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED']),
    query('userId').optional().isUUID(),
    query('listingId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }).default(1),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(20)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const isAdmin = req.user.roles?.includes('admin');
      const { status, userId: filterUserId, listingId, page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (filterUserId) {
        where.userId = filterUserId;
      }
      
      if (listingId) {
        where.listingId = listingId;
      }

      // For vendors, filter by licenses for their listings
      if (!isAdmin) {
        where.listing = {
          vendorId: userId
        };
      }

      const [licenses, total] = await Promise.all([
        prisma.marketplaceLicense.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: { name: true, email: true }
            },
            listing: {
              select: { title: true, type: true, vendorId: true }
            }
          }
        }),
        prisma.marketplaceLicense.count({ where })
      ]);

      const hasMore = skip + limit < total;

      res.json({
        licenses: licenses.map(license => ({
          id: license.id,
          user: license.user,
          listing: license.listing,
          status: license.status,
          scope: license.scopeJson,
          usageCount: license.usageCount,
          maxUsage: license.maxUsage,
          startAt: license.startAt,
          endAt: license.endAt,
          createdAt: license.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      });

    } catch (error) {
      console.error('Admin licenses fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch licenses' });
    }
  }
);

/**
 * PATCH /admin/licenses/:id/revoke - Revoke a license
 */
router.patch('/licenses/:id/revoke',
  [
    param('id').isUUID(),
    body('reason').isString().notEmpty()
  ],
  requireAdminOrVendor,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const adminUserId = req.user.id;
      const isAdmin = req.user.roles?.includes('admin');
      const { id } = req.params;
      const { reason } = req.body;

      const where: any = { id };
      
      // Vendors can only revoke licenses for their listings
      if (!isAdmin) {
        where.listing = {
          vendorId: adminUserId
        };
      }

      const license = await prisma.marketplaceLicense.findUnique({
        where,
        include: {
          listing: {
            select: { title: true, vendorId: true }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      });

      if (!license) {
        return res.status(404).json({ error: 'License not found' });
      }

      if (license.status === LicenseStatus.REVOKED) {
        return res.status(409).json({ error: 'License already revoked' });
      }

      const updatedLicense = await prisma.marketplaceLicense.update({
        where: { id },
        data: {
          status: LicenseStatus.REVOKED,
          revokedAt: new Date(),
          revokedBy: adminUserId,
          revokeReason: reason
        }
      });

      // Log the revocation
      await prisma.auditLog.create({
        data: {
          id: uuidv4(),
          userId: adminUserId,
          action: 'license.revoked',
          resourceType: 'marketplace_license',
          resourceId: id,
          details: {
            licenseeEmail: license.user.email,
            listingTitle: license.listing.title,
            reason
          }
        }
      });

      res.json({
        id: updatedLicense.id,
        status: updatedLicense.status,
        revokedAt: updatedLicense.revokedAt,
        revokeReason: updatedLicense.revokeReason
      });

    } catch (error) {
      console.error('License revocation error:', error);
      res.status(500).json({ error: 'Failed to revoke license' });
    }
  }
);

export default router;