# syntax=docker/dockerfile:1.7

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Enable better npm cache reuse across Docker builds
ENV npm_config_cache=/root/.npm

# Install dependencies
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy only build-relevant files so the cache is not invalidated by docs/tests/artifacts
COPY tsconfig*.json vite.config.* index.html postcss.config.* tailwind.config.* eslint.config.js ./
COPY public ./public
COPY src ./src

# Copy env files for VITE_* variables used at build time
COPY .env* ./

RUN npm run build

# Production stage (Serving with Nginx)
FROM nginx:alpine

# Security: Add security headers and configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
