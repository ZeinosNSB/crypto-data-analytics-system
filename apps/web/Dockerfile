FROM node:24.11.0-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY apps/web/public ./apps/web/public
COPY apps/web/.next/standalone ./
COPY apps/web/.next/static ./apps/web/.next/static

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER nextjs
EXPOSE ${PORT}

CMD ["node", "apps/web/server.js"]
