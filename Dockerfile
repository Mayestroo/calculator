FROM node:20-slim

# Set working directory
WORKDIR /app

# Install build dependencies for native compilation (python3, make, g++)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start application (server.js automatically runs initDatabase and runSeed at runtime)
CMD ["npm", "start"]
