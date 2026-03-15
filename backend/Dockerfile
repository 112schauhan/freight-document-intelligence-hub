# Backend image with Node, Poppler (pdftotext, pdftoppm), and app deps.
# Use Debian-based image so we can install poppler-utils.
FROM node:20-bookworm-slim

# Install Poppler (PDF) and OpenSSL (required by Prisma).
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

COPY src ./src/
COPY tsconfig.json* ./

# Build not required if using tsx; for production we run with node after compile or use tsx.
# Prisma 7 + adapter expects to run with tsx or compiled JS. Use tsx for simplicity.
RUN npm install -g tsx

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Migrations and seed (idempotent), then start server. Set DATABASE_URL at runtime.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && exec tsx src/server.ts"]
