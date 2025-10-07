import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/billing/plans - Get public plans
router.get('/', async (req: Request, res: Response) => {
  try {
    // Mock plans data for now
    const plans = [
      {
        id: 'starter',
        name: 'Starter',
        tagline: 'Perfect for individuals and small teams getting started',
        price_cents: 999,
        billing_cycle: 'monthly',
        features: ['5 MCP agents', 'Basic support', '100 API calls/month'],
        active: true
      }
    ];
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans',
      message: 'An internal server error occurred'
    });
  }
});

export default router;
