#!/bin/sh
set -e

# ───────────────────────────────────────────────────────────────────────
# entrypoint.sh — runs once per container start.
#
#   1. Apply pending migrations (idempotent — typeorm tracks applied rows
#      in the `migrations` table; already-applied files are no-ops).
#   2. Optionally run the seed when SEED_ON_BOOT=true. Seeds are upserts
#      keyed on natural keys (code, name, email), so re-running is safe.
#      Default off — the seed plants the default super admin with a
#      shipped password, which we don't want re-asserted on every boot
#      in non-bootstrap environments.
#   3. exec the app so Node ends up as PID-equivalent under dumb-init
#      and receives SIGTERM directly.
#
# Race note (v0): when scaling to >1 API instance, two containers
# starting simultaneously will both attempt migration:run. TypeORM
# handles this safely (advisory lock on the migrations table), but
# moving to a dedicated migration job is the right answer at that
# point. Tracked in plan.md §"Risks and mitigations".
# ───────────────────────────────────────────────────────────────────────

echo "[entrypoint] applying migrations..."
npm run migration:run:prod

if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
  echo "[entrypoint] SEED_ON_BOOT=true — running seed (idempotent)..."
  npm run seed:prod
else
  echo "[entrypoint] SEED_ON_BOOT not set — skipping seed."
fi

echo "[entrypoint] starting app..."
exec node dist/main.js
