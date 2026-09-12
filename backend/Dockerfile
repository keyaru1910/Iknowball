FROM node:22-alpine

WORKDIR /app

# Install dependencies before copying source to retain the dependency cache.
COPY package*.json ./
RUN npm ci

# Build in the image so a clean checkout does not depend on a local dist/ folder.
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate --schema=./src/module/prisma/schema.prisma
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/main.js"]
