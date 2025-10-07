FROM node:18-alpine

WORKDIR /app

# Install dependencies (including dev dependencies for tsx)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/health || exit 1

# Use development mode with tsx for TypeScript
CMD ["npm", "run", "dev"]