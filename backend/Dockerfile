# Single-stage image using Node 20 and ts-node at runtime (no TypeScript build)
FROM node:20-alpine

WORKDIR /app

# Install dependencies (including dev for ts-node)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy app files
COPY tsconfig.json ./
COPY knexfile.js ./
COPY migrations ./migrations
COPY seeds ./seeds
COPY src ./src

# Create runtime dirs
RUN mkdir -p logs uploads && \
    addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with ts-node transpile-only
CMD ["node", "-r", "ts-node/register/transpile-only", "src/server.ts"]