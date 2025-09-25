# Multi-stage Dockerfile for Unified Attendance System
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install dependencies for backend and fp-api
COPY backend/package*.json ./backend/
COPY fp-api/package*.json ./fp-api/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Install fp-api dependencies
WORKDIR /app/fp-api
RUN npm ci --only=production

# Go back to root
WORKDIR /app

# Copy backend source code
COPY backend/ ./backend/

# Copy fp-api source code
COPY fp-api/ ./fp-api/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the unified server
CMD ["node", "backend/server.js"]
