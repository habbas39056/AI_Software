# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/ClientApp
COPY ClientApp/package*.json ./
RUN npm ci
COPY ClientApp/ ./
RUN npm run build

# Stage 2: Production - Node.js backend serving built frontend
FROM node:20-alpine
WORKDIR /app

# Copy backend package files and install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/ClientApp/dist ./ClientApp/dist

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "backend/server.js"]
