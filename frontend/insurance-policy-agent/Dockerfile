# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# --- Build Stage ---
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
# Make sure FASTAPI_BACKEND_URL is available at build time if needed for static generation,
# or it can be passed at runtime. For client-side calls, runtime is fine.
ARG FASTAPI_BACKEND_URL
ENV FASTAPI_BACKEND_URL=${FASTAPI_BACKEND_URL}
RUN npm run build

# --- Production Stage ---
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
# ARG FASTAPI_BACKEND_URL # This will be set in docker-compose
# ENV FASTAPI_BACKEND_URL=${FASTAPI_BACKEND_URL}

# Copy built assets from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Expose port 3000
EXPOSE 3000

# Set the user to run the application (optional, but good practice)
USER node

# Command to run the application
# Using the output standalone mode for optimized production server
CMD ["node", "server.js"] 