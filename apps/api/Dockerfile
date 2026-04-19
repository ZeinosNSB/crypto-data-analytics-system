FROM oven/bun:1.2.2-alpine AS runner

WORKDIR /app

# Copy build
COPY dist/apps/api/index.js ./api/index.js
COPY dist/apps/api/package.json ./api/package.json

# Install production dependencies for both
RUN cd api && bun install --production

ENV NODE_ENV=production
ENV START_MODE=api
ENV PORT=4000

USER bun
EXPOSE ${PORT}

CMD ["bun", "run", "api/index.js"]
