# Multi-stage Dockerfile for Royal Shape Backend
# Stage 1: Builder - Install dependencies and build TypeScript
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies (including dev dependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code and config
COPY . .

# Run the punycode replacement script
RUN find ./node_modules -type f -exec sed -i 's/require("punycode")/require("punycode\\/")/' {} + 2>/dev/null || true

# Build TypeScript
RUN yarn build

# Stage 2: Production - Create minimal production image
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy compiled config folder (node-config expects it at /app/config)
COPY --from=builder --chown=nodejs:nodejs /app/dist/config ./config

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app/uploads

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8070

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8070/', (r) => {if (r.statusCode !== 200) throw new Error('Health check failed')})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/src/index.js"]
