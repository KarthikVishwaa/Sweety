# syntax=docker/dockerfile:1
# Build context is the repository root: docker build -f server/Dockerfile .

FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --workspace server --ignore-scripts
COPY server server
RUN npm run build -w server

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --workspace server --omit=dev --ignore-scripts && npm cache clean --force

WORKDIR /app/server
COPY --from=build --chown=node:node /app/server/dist dist
COPY --chown=node:node server/src src
COPY --chown=node:node server/scripts scripts
COPY --chown=node:node server/migrations migrations
COPY --chown=node:node server/docker-entrypoint.sh docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
