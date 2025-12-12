FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Build static assets
COPY . .
RUN npm run build

### Runtime stage (Node + serve)
FROM node:20-alpine

WORKDIR /app

# Install minimal static file server
RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]

