# Dark Matter Marketplace Service

The Marketplace is a microservice for buying, selling, and licensing AI agents, tools, teams, and plugins within the Dark Matter ecosystem.

## Overview

The Marketplace enables:
- **Agent Discovery**: Browse and search AI agents by capabilities
- **Tool Marketplace**: Find and purchase specialized tools
- **Team Bundles**: Buy pre-configured agent teams
- **License Management**: Time-based and usage-based licensing
- **Vendor Dashboard**: Create and manage listings
- **Admin Portal**: Moderate content and manage operations

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Admin Portal   │    │ Vendor Portal   │
│   (Next.js)     │    │   (Next.js)     │    │   (Next.js)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │            User API (Express.js)                │
         │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
         │  │Catalog  │ │Cart/    │ │License  │ │Admin/  │ │
         │  │Routes   │ │Orders   │ │Routes   │ │Vendor  │ │
         │  └─────────┘ └─────────┘ └─────────┘ └────────┘ │
         └─────────────────┬───────────────────────────────┘
                          │
         ┌─────────────────┴───────────────────────────────┐
         │               Database (PostgreSQL)             │
         │  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐│
         │  │   Listings   │ │   Orders    │ │  Licenses   ││
         │  │   Vendors    │ │   Cart      │ │  Audit Log  ││
         │  └──────────────┘ └─────────────┘ └─────────────┘│
         └─────────────────────────────────────────────────┘
```

## Core Features

### 🛍️ Catalog & Discovery
- **Search & Filter**: Find agents by capabilities, price, rating
- **Categories**: Organize by use case (Automation, Analysis, Creative, etc.)
- **Featured Listings**: Promoted content and editor picks
- **Detailed Views**: Manifest inspection, screenshots, reviews

### 🛒 Shopping Experience
- **Shopping Cart**: Multi-item purchases with quantity
- **Secure Checkout**: Stripe integration with PCI compliance
- **Order Management**: Purchase history and status tracking
- **Receipt Generation**: Detailed invoices and tax handling

### 🔐 License Management
- **JWT Tokens**: Cryptographically signed license tokens
- **Flexible Scoping**: Tenant, lab, and time-based restrictions
- **Usage Tracking**: Monitor activation and consumption limits
- **Automatic Expiry**: Time-based and usage-based license expiry

### 👤 Vendor Tools
- **Listing Management**: Create and update marketplace listings
- **Analytics Dashboard**: Sales metrics, revenue tracking
- **Review System**: Manage customer feedback and ratings
- **Payout Integration**: Automated revenue distribution

### 🔧 Admin Controls
- **Content Moderation**: Review and approve new listings
- **User Management**: Vendor approval and suspension
- **Financial Oversight**: Transaction monitoring and dispute resolution
- **System Health**: Performance metrics and error tracking

## API Endpoints

### Public Catalog
```
GET    /catalog              # Browse listings with search/filter
GET    /catalog/:id          # Get listing details
GET    /catalog/featured     # Get featured listings
GET    /catalog/categories   # List all categories
```

### Shopping Cart & Orders
```
POST   /cart/add             # Add item to cart
GET    /cart                 # Get cart contents
PUT    /cart/:itemId         # Update cart item
DELETE /cart/:itemId         # Remove cart item
POST   /orders/checkout      # Create order from cart
GET    /orders               # Get user orders
GET    /orders/:id           # Get order details
```

### License Management
```
POST   /licenses/activate    # Activate purchased license
GET    /licenses             # Get user licenses
GET    /licenses/:id         # Get license details
POST   /licenses/:id/usage   # Track license usage
POST   /licenses/verify      # Verify license token (external)
```

### Vendor Dashboard
```
POST   /vendor/listings      # Create new listing
GET    /vendor/listings      # Get vendor listings
PUT    /vendor/listings/:id  # Update listing
POST   /vendor/listings/:id/submit  # Submit for review
GET    /vendor/analytics     # Get sales analytics
```

### Admin Portal
```
GET    /admin/dashboard      # Admin dashboard stats
GET    /admin/listings       # All listings for moderation
PATCH  /admin/listings/:id   # Update listing status
GET    /admin/orders         # All orders
GET    /admin/licenses       # All licenses
PATCH  /admin/licenses/:id/revoke  # Revoke license
```

## Database Schema

### Core Tables
- **marketplace_listings**: Agent/tool listings with manifest
- **marketplace_orders**: Purchase orders with payment info
- **marketplace_order_items**: Line items within orders
- **marketplace_licenses**: Active licenses with JWT tokens
- **marketplace_carts**: User shopping carts
- **marketplace_cart_items**: Items within carts
- **audit_logs**: All user actions and system events

### Key Relationships
- Listings belong to Vendors (Users with vendor role)
- Orders contain multiple Order Items
- Order Items reference Listings
- Licenses are generated from completed Orders
- All actions are logged in Audit table

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/marketplace"

# Authentication
AUTH_ISSUER_URL="http://auth-service:8080"
AUTH_CLIENT_ID="marketplace-api"
AUTH_CLIENT_SECRET="secret-key"

# Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# License Signing
LICENSE_SIGNING_KEY="your-256-bit-secret"
LICENSE_ISSUER="marketplace.darkmatter.local"

# Events
EVENTS_TYPE="nats"  # or "redis"
EVENTS_URL="nats://localhost:4222"

# Feature Flags
FEATURE_MARKETPLACE_ENABLED="true"
FEATURE_VENDOR_SIGNUP_ENABLED="true"
MAINTENANCE_MODE="false"

# Logging
LOG_LEVEL="info"
REQUEST_LOG_ENABLED="true"
```

### Docker Configuration
```yaml
# docker-compose.yml
services:
  marketplace-user-api:
    build: ./backend/user
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/marketplace
      - AUTH_ISSUER_URL=http://auth-service:8080
    depends_on:
      - postgres
      - auth-service
    networks:
      - darkmatter
```

## Development

### Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed development data
npm run prisma:seed

# Start development server
npm run dev
```

### Testing
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Database Operations
```bash
# Create new migration
npx prisma migrate dev --name add-new-feature

# Reset database (dev only)
npx prisma migrate reset

# Browse data
npx prisma studio
```

## Security

### Authentication
- JWT token validation for all protected routes
- Role-based access control (user, vendor, admin)
- Tenant isolation for multi-tenant deployments

### License Security
- Cryptographically signed JWT license tokens
- Token verification without database lookup
- Automatic expiry and usage tracking
- Revocation support with audit trail

### Payment Security
- PCI-compliant Stripe integration
- Webhook signature verification
- Idempotent payment processing
- Comprehensive audit logging

### Data Protection
- Input validation with express-validator
- SQL injection prevention with Prisma
- XSS protection with helmet
- Rate limiting per IP and user

## Integration

### With Auth Service
- Single Sign-On (SSO) integration
- OIDC/OAuth2 token validation
- Role and permission synchronization

### With Event Bus
- Order completion events
- License activation notifications
- Vendor status changes
- System health metrics

### With Labs Service
- License verification for agent deployment
- Usage tracking for sandbox environments
- Resource quota enforcement

### With Arena Service
- Prize distribution through marketplace
- Tool licensing for competitions
- Bounty payment processing

## Monitoring & Observability

### Health Checks
```
GET /health       # Service health status
GET /health/ready # Readiness probe
GET /health/live  # Liveness probe
```

### Metrics
- Order completion rates
- License activation success
- Payment processing latency
- API response times
- Database connection health

### Logging
- Structured JSON logging with Winston
- Request/response logging
- Error tracking with stack traces
- Audit trail for all mutations
- Payment transaction logs

## Deployment

### Production Checklist
- [ ] Database migrations applied
- [ ] Stripe webhooks configured
- [ ] SSL certificates installed
- [ ] Environment variables set
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy verified

### Scaling Considerations
- Horizontal scaling with load balancer
- Database connection pooling
- Redis for session storage
- CDN for static assets
- Background job processing

## API Documentation

Full OpenAPI/Swagger documentation available at `/api-docs` when running in development mode.

Interactive API explorer includes:
- Request/response schemas
- Authentication examples
- Error code documentation
- Rate limiting information

---

**Part of the Dark Matter Microservices Suite**
- [Auth Service](../auth/README.md) - Authentication & authorization
- [Academy Service](../academy/README.md) - Training & certification
- [Labs Service](../labs/README.md) - Sandbox environments
- [Arena Service](../arena/README.md) - Bug bounty platform