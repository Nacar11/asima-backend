# syntax=docker/dockerfile:1.6

# ───────────────────────────────────────────────────────────────────────
# Stage 1 — builder
# Installs every dep (incl. dev) and compiles TS → dist/.
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Layer caching: copy only manifests first so `npm ci` is reused when
# only source files change.
COPY package.json package-lock.json ./
RUN npm ci

# Now copy the source and build. tsconfig + nest-cli.json are needed
# at build time for path-alias resolution and nest's compiler.
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN npm run build \
 && npm prune --omit=dev

# ───────────────────────────────────────────────────────────────────────
# Stage 2 — runner
# Slim image. Production deps only. Drops privileges.
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# `curl` powers the docker healthcheck (`/api/v1/health`). `dumb-init`
# becomes PID 1 so Node receives SIGTERM cleanly during docker stop.
# `tini` would also work; dumb-init is smaller.
RUN apk add --no-cache curl dumb-init

# Pull built artifacts and the pruned production node_modules.
# Migrations + seeds run from the COMPILED output (dist/), so no ts-node
# is needed at runtime. Scripts `migration:run:prod` and `seed:prod` in
# package.json point at dist/.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Non-root user. node:alpine ships with `node` (uid 1000) already.
USER node

EXPOSE 3000

# Health probe matches docker-compose's healthcheck; running it from the
# image makes `docker run` standalone usable too.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -fsS http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/entrypoint.sh"]
