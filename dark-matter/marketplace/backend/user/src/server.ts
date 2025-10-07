import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { AuthClient } from '@dark-matter/auth';
import { createEventPublisher } from '@dark-matter/events';
import winston from 'winston';

// Routes
import catalogRoutes from './routes/catalog';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import licenseRoutes from './routes/licenses';
import adminRoutes from './routes/admin';
import vendorRoutes from './routes/vendor';
import healthRoutes from './routes/health';

// Middleware
import { authMiddleware } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';
import { featureGateMiddleware } from './middleware/feature-gate';

// Initialize services
const prisma = new PrismaClient();
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'marketplace-user.log' })
  ]
});

// Auth client
const authConfig = {
  issuerUrl: process.env.AUTH_ISSUER_URL!,
  clientId: process.env.AUTH_CLIENT_ID!,
  clientSecret: process.env.AUTH_CLIENT_SECRET!
};
const authClient = new AuthClient(authConfig);

// Event publisher
const eventPublisher = createEventPublisher(
  process.env.EVENTS_TYPE as 'nats' | 'redis' || 'nats',
  process.env.EVENTS_URL!
);

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3010'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Feature gate middleware (check if marketplace is enabled)
app.use(featureGateMiddleware);

// Request logging
app.use((req, res, next) => {
  if (process.env.REQUEST_LOG_ENABLED === 'true') {
    logger.info('Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
});

// Public routes
app.use('/health', healthRoutes);

// Protected routes (require authentication)
app.use('/catalog', authMiddleware(authClient), auditMiddleware(prisma), catalogRoutes);
app.use('/cart', authMiddleware(authClient), auditMiddleware(prisma), cartRoutes);
app.use('/orders', authMiddleware(authClient), auditMiddleware(prisma), orderRoutes);
app.use('/licenses', authMiddleware(authClient), auditMiddleware(prisma), licenseRoutes);
app.use('/admin', authMiddleware(authClient), auditMiddleware(prisma), adminRoutes);
app.use('/vendor', authMiddleware(authClient), auditMiddleware(prisma), vendorRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  await eventPublisher.close();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  logger.info(`Marketplace User API running on port ${PORT}`);
});

export { prisma, authClient, eventPublisher, logger };