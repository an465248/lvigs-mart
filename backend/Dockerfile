FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S lvigs && adduser -S lvigs -u 1001
COPY --from=builder --chown=lvigs:lvigs /app/dist ./dist
COPY --from=builder --chown=lvigs:lvigs /app/node_modules ./node_modules
COPY --from=builder --chown=lvigs:lvigs /app/prisma ./prisma
COPY --from=builder --chown=lvigs:lvigs /app/package.json ./package.json
USER lvigs
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health/live || exit 1
CMD ["node", "dist/src/main"]
