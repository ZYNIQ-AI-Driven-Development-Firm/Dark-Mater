import { Router } from 'express';
import { query, param, validationResult } from 'express-validator';
import { prisma } from '../server';
import { ListingType, ListingStatus } from '@prisma/client';

const router = Router();

/**
 * GET /catalog - Browse marketplace catalog
 */
router.get('/',
  [
    query('type').optional().isIn(['AGENT', 'TEAM', 'TOOL', 'PLUGIN']),
    query('query').optional().isString().isLength({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('page').optional().isInt({ min: 1 }).default(1),
    query('limit').optional().isInt({ min: 1, max: 50 }).default(20),
    query('sort').optional().isIn(['newest', 'popular', 'rating', 'price_asc', 'price_desc'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        type,
        query: searchQuery,
        category,
        page = 1,
        limit = 20,
        sort = 'newest'
      } = req.query as any;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        status: ListingStatus.PUBLISHED
      };

      if (type) {
        where.type = type as ListingType;
      }

      if (searchQuery) {
        where.OR = [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { summary: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ];
      }

      // Build orderBy clause
      let orderBy: any = { createdAt: 'desc' };
      switch (sort) {
        case 'popular':
          orderBy = { downloads: 'desc' };
          break;
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        case 'price_asc':
          orderBy = { priceCents: 'asc' };
          break;
        case 'price_desc':
          orderBy = { priceCents: 'desc' };
          break;
      }

      const [listings, total] = await Promise.all([
        prisma.marketplaceListing.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            type: true,
            title: true,
            summary: true,
            priceCents: true,
            billingCycle: true,
            featured: true,
            downloads: true,
            rating: true,
            createdAt: true,
            reviews: {
              select: { rating: true },
              take: 5
            }
          }
        }),
        prisma.marketplaceListing.count({ where })
      ]);

      const hasMore = skip + limit < total;
      const nextPage = hasMore ? page + 1 : null;

      res.json({
        listings,
        pagination: {
          page,
          limit,
          total,
          hasMore,
          nextPage
        }
      });

    } catch (error) {
      console.error('Catalog fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch catalog' });
    }
  }
);

/**
 * GET /catalog/:id - Get listing details
 */
router.get('/:id',
  [param('id').isUUID()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      const listing = await prisma.marketplaceListing.findFirst({
        where: {
          id,
          status: ListingStatus.PUBLISHED
        },
        include: {
          reviews: {
            select: {
              id: true,
              userId: true,
              rating: true,
              comment: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Increment view count (could be done asynchronously)
      prisma.marketplaceListing.update({
        where: { id },
        data: { downloads: { increment: 1 } }
      }).catch(console.error);

      res.json({ listing });

    } catch (error) {
      console.error('Listing fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch listing' });
    }
  }
);

/**
 * GET /catalog/featured - Get featured listings
 */
router.get('/featured', async (req, res) => {
  try {
    const featuredListings = await prisma.marketplaceListing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
        featured: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        summary: true,
        priceCents: true,
        billingCycle: true,
        downloads: true,
        rating: true,
        createdAt: true
      }
    });

    res.json({ listings: featuredListings });

  } catch (error) {
    console.error('Featured listings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch featured listings' });
  }
});

export default router;