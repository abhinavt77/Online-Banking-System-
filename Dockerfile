FROM node:22-alpine
WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend static files
RUN npm run build:client

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]
