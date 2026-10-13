FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install python and build tools for native compilation if required
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production || npm install --production

# Copy application code
COPY . .

# Run initial seed if database doesn't exist yet
RUN node seed.js

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start application
CMD ["npm", "start"]
