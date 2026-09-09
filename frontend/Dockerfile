# ---------------------------------------------------------------------------
# AI Internship Platform — Frontend Production Dockerfile
# Stage 1: Build React/Vite SPA
# Stage 2: Serve with Nginx
# ---------------------------------------------------------------------------

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached)
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Build production bundle to /app/dist
RUN npm run build

# Stage 2: Production Web Server
FROM nginx:alpine AS runner

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
