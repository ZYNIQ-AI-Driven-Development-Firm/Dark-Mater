import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/billing/admin/plans - Get all plans for admin
router.get('/plans', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Admin plans endpoint - not implemented yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin plans',
      message: 'An internal server error occurred'
    });
  }
});

export default router;
