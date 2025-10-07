import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../server';
import { ListingStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Middleware to ensure vendor role
const requireVendor = (req: any, res: any, next: any) => {
  const userRoles = req.user.roles || [];
  
  if (!userRoles.includes('vendor') && !userRoles.includes('admin')) {
    return res.status(403).json({ error: 'Vendor role required' });
  }
  
  next();
};

/**
 * POST /vendor/listings - Create a new listing
 */
router.post('/listings',
  [
    body('title').isString().isLength({ min: 3, max: 100 }),
    body('summary').isString().isLength({ min: 10, max: 500 }),
    body('description').isString().isLength({ min: 50, max: 5000 }),
    body('type').isIn(['AGENT', 'TEAM', 'TOOL', 'PLUGIN']),
    body('price').isDecimal({ decimal_digits: '0,2' }),
    body('currency').isIn(['USD', 'EUR', 'GBP']).default('USD'),
    body('manifestJson').isObject(),
    body('tags').isArray(),
    body('tags.*').isString(),
    body('category').isString(),
    body('licenseType').isIn(['SINGLE_USE', 'UNLIMITED', 'SUBSCRIPTION']),
    body('subscriptionDays').optional().isInt({ min: 1 }),
    body('maxActivations').optional().isInt({ min: 1 })
  ],
  requireVendor,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vendorId = req.user.id;
      const {
        title,
        summary,
        description,
        type,
        price,
        currency = 'USD',
        manifestJson,
        tags,
        category,
        licenseType,
        subscriptionDays,
        maxActivations
      } = req.body;

      // Validate manifest structure based on type
      const requiredFields = ['name', 'version', 'description'];
      for (const field of requiredFields) {
        if (!manifestJson[field]) {
          return res.status(400).json({ 
            error: `Manifest missing required field: ${field}` 
          });
        }
      }

      // Type-specific manifest validation
      if (type === 'AGENT' && !manifestJson.capabilities) {
        return res.status(400).json({ 
          error: 'Agent manifest must include capabilities' 
        });
      }

      if (type === 'TEAM' && !manifestJson.agents) {
        return res.status(400).json({ 
          error: 'Team manifest must include agents array' 
        });
      }

      if (type === 'TOOL' && !manifestJson.endpoints) {
        return res.status(400).json({ 
          error: 'Tool manifest must include endpoints' 
        });
      }

      const listing = await prisma.marketplaceListing.create({
        data: {
          id: uuidv4(),
          vendorId,
          title,
          summary,
          description,
          type,
          price: parseFloat(price),
          currency,
          manifestJson,
          tags,
          category,
          licenseType,
          subscriptionDays,
          maxActivations,
          status: ListingStatus.DRAFT
        }
      });

      res.status(201).json({
        id: listing.id,
        title: listing.title,
        type: listing.type,
        status: listing.status,
        price: listing.price,
        currency: listing.currency,
        createdAt: listing.createdAt
      });

    } catch (error) {
      console.error('Listing creation error:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  }
);

/**
 * GET /vendor/listings - Get vendor's listings
 */
router.get('/listings', requireVendor,
  [
    query('status').optional().isIn(['DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED']),
    query('type').optional().isIn(['AGENT', 'TEAM', 'TOOL', 'PLUGIN']),
    query('page').optional().isInt({ min: 1 }).default(1),
    query('limit').optional().isInt({ min: 1, max: 50 }).default(20)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vendorId = req.user.id;
      const { status, type, page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const where: any = { vendorId };
      
      if (status) {
        where.status = status;
      }
      
      if (type) {
        where.type = type;
      }

      const [listings, total] = await Promise.all([
        prisma.marketplaceListing.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
          include: {
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
          currency: listing.currency,
          createdAt: listing.createdAt,
          updatedAt: listing.updatedAt,
          reviewReason: listing.reviewReason,
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
      console.error('Vendor listings fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  }
);

/**
 * GET /vendor/listings/:id - Get specific listing details
 */
router.get('/listings/:id',
  [param('id').isUUID()],
  requireVendor,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vendorId = req.user.id;
      const { id } = req.params;

      const listing = await prisma.marketplaceListing.findFirst({
        where: {
          id,
          vendorId
        },
        include: {
          _count: {
            select: { 
              orders: true,
              licenses: true
            }
          }
        }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      res.json({
        id: listing.id,
        title: listing.title,
        summary: listing.summary,
        description: listing.description,
        type: listing.type,
        status: listing.status,
        price: listing.price,
        currency: listing.currency,
        manifestJson: listing.manifestJson,
        tags: listing.tags,
        category: listing.category,
        licenseType: listing.licenseType,
        subscriptionDays: listing.subscriptionDays,
        maxActivations: listing.maxActivations,
        reviewReason: listing.reviewReason,
        reviewedAt: listing.reviewedAt,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        stats: {
          orders: listing._count.orders,
          licenses: listing._count.licenses
        }
      });

    } catch (error) {
      console.error('Listing fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch listing' });
    }
  }
);

/**
 * PUT /vendor/listings/:id - Update listing
 */
router.put('/listings/:id',
  [
    param('id').isUUID(),
    body('title').optional().isString().isLength({ min: 3, max: 100 }),
    body('summary').optional().isString().isLength({ min: 10, max: 500 }),
    body('description').optional().isString().isLength({ min: 50, max: 5000 }),
    body('price').optional().isDecimal({ decimal_digits: '0,2' }),
    body('currency').optional().isIn(['USD', 'EUR', 'GBP']),
    body('manifestJson').optional().isObject(),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString(),
    body('category').optional().isString(),
    body('licenseType').optional().isIn(['SINGLE_USE', 'UNLIMITED', 'SUBSCRIPTION']),
    body('subscriptionDays').optional().isInt({ min: 1 }),
    body('maxActivations').optional().isInt({ min: 1 })
  ],
  requireVendor,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vendorId = req.user.id;
      const { id } = req.params;

      const existingListing = await prisma.marketplaceListing.findFirst({
        where: {
          id,
          vendorId
        }
      });

      if (!existingListing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Can't edit active listings (except certain fields)
      if (existingListing.status === ListingStatus.ACTIVE) {
        const allowedFields = ['description', 'tags', 'category'];
        const updateFields = Object.keys(req.body);
        const disallowedFields = updateFields.filter(field => !allowedFields.includes(field));
        
        if (disallowedFields.length > 0) {
          return res.status(409).json({ 
            error: 'Cannot modify core fields of active listing',
            disallowedFields
          });
        }
      }

      const updateData: any = {};
      
      // Only update provided fields
      const fields = [
        'title', 'summary', 'description', 'price', 'currency',
        'manifestJson', 'tags', 'category', 'licenseType', 
        'subscriptionDays', 'maxActivations'
      ];

      for (const field of fields) {
        if (req.body[field] !== undefined) {
          updateData[field] = field === 'price' ? parseFloat(req.body[field]) : req.body[field];
        }
      }

      // Reset review status if significant changes
      const significantFields = ['title', 'manifestJson', 'price', 'licenseType'];
      const hasSignificantChanges = significantFields.some(field => req.body[field] !== undefined);
      
      if (hasSignificantChanges && existingListing.status === ListingStatus.ACTIVE) {
        updateData.status = ListingStatus.PENDING;
        updateData.reviewReason = null;
        updateData.reviewedAt = null;
        updateData.reviewedBy = null;
      }

      const updatedListing = await prisma.marketplaceListing.update({
        where: { id },
        data: updateData
      });

      res.json({
        id: updatedListing.id,
        title: updatedListing.title,
        type: updatedListing.type,
        status: updatedListing.status,
        price: updatedListing.price,
        currency: updatedListing.currency,
        updatedAt: updatedListing.updatedAt
      });

    } catch (error) {
      console.error('Listing update error:', error);
      res.status(500).json({ error: 'Failed to update listing' });
    }
  }
);

/**
 * POST /vendor/listings/:id/submit - Submit listing for review
 */
router.post('/listings/:id/submit',
  [param('id').isUUID()],
  requireVendor,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vendorId = req.user.id;
      const { id } = req.params;

      const listing = await prisma.marketplaceListing.findFirst({
        where: {
          id,
          vendorId,
          status: ListingStatus.DRAFT
        }
      });

      if (!listing) {
        return res.status(404).json({ 
          error: 'Draft listing not found' 
        });
      }

      // Validate listing is complete
      const requiredFields = ['title', 'summary', 'description', 'manifestJson', 'category'];
      const missingFields = requiredFields.filter(field => !listing[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Listing incomplete',
          missingFields
        });
      }

      const updatedListing = await prisma.marketplaceListing.update({
        where: { id },
        data: {
          status: ListingStatus.PENDING,
          submittedAt: new Date()
        }
      });

      res.json({
        id: updatedListing.id,
        status: updatedListing.status,
        submittedAt: updatedListing.submittedAt
      });

    } catch (error) {
      console.error('Listing submission error:', error);
      res.status(500).json({ error: 'Failed to submit listing' });
    }
  }
);

/**
 * GET /vendor/analytics - Get vendor sales analytics
 */
router.get('/analytics', requireVendor,
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).default('30d'),
    query('listingId').optional().isUUID()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vendorId = req.user.id;
      const { period = '30d', listingId } = req.query as any;

      // Calculate date range
      const now = new Date();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[period];
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const vendorFilter = { vendorId };
      const listingFilter = listingId ? { id: listingId, vendorId } : vendorFilter;

      const [
        totalRevenue,
        totalOrders,
        totalLicenses,
        activeListings,
        revenueByListing,
        ordersByDay
      ] = await Promise.all([
        // Total revenue
        prisma.marketplaceOrder.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate },
            items: {
              some: {
                listing: listingFilter
              }
            }
          }
        }),

        // Total orders
        prisma.marketplaceOrder.count({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate },
            items: {
              some: {
                listing: listingFilter
              }
            }
          }
        }),

        // Total licenses issued
        prisma.marketplaceLicense.count({
          where: {
            createdAt: { gte: startDate },
            listing: listingFilter
          }
        }),

        // Active listings count
        prisma.marketplaceListing.count({
          where: {
            ...vendorFilter,
            status: 'ACTIVE'
          }
        }),

        // Revenue by listing
        prisma.$queryRaw`
          SELECT 
            ml.id,
            ml.title,
            ml.type,
            COALESCE(SUM(moi.price * moi.quantity), 0) as revenue,
            COUNT(DISTINCT mo.id) as orders
          FROM marketplace_listings ml
          LEFT JOIN marketplace_order_items moi ON ml.id = moi.listing_id
          LEFT JOIN marketplace_orders mo ON moi.order_id = mo.id 
            AND mo.status = 'COMPLETED' 
            AND mo.created_at >= ${startDate}
          WHERE ml.vendor_id = ${vendorId}
            ${listingId ? `AND ml.id = ${listingId}` : ''}
          GROUP BY ml.id, ml.title, ml.type
          ORDER BY revenue DESC
          LIMIT 10
        `,

        // Orders by day
        prisma.$queryRaw`
          SELECT 
            DATE(mo.created_at) as date,
            COUNT(DISTINCT mo.id) as orders,
            COALESCE(SUM(mo.total_amount), 0) as revenue
          FROM marketplace_orders mo
          JOIN marketplace_order_items moi ON mo.id = moi.order_id
          JOIN marketplace_listings ml ON moi.listing_id = ml.id
          WHERE ml.vendor_id = ${vendorId}
            AND mo.status = 'COMPLETED'
            AND mo.created_at >= ${startDate}
            ${listingId ? `AND ml.id = ${listingId}` : ''}
          GROUP BY DATE(mo.created_at)
          ORDER BY date DESC
        `
      ]);

      res.json({
        period,
        summary: {
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalOrders,
          totalLicenses,
          activeListings
        },
        revenueByListing,
        ordersByDay
      });

    } catch (error) {
      console.error('Vendor analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
);

export default router;