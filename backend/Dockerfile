FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production + dev for prisma generate)
RUN npm install

# Copy pre-built dist and source for prisma
COPY dist/ ./dist/
COPY src/module/prisma/schema.prisma ./prisma/schema.prisma

# Generate prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma || true

# Expose port
EXPOSE 4000

# Start NestJS
CMD ["node", "dist/main.js"]