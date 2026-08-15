#!/usr/bin/env bash
# Prints row counts for the tables a demo reset is expected to change.
# Run before and after the reset so a silent failure (truncate worked, reseed
# didn't) is visible in the workflow log instead of only in the demo.
#
# Connection comes from libpq's PG* environment variables — see the env block
# in .github/workflows/demo-reset.yml.
set -euo pipefail

psql -v ON_ERROR_STOP=1 -c "
  SELECT
    (SELECT count(*) FROM users)                    AS users,
    (SELECT count(*) FROM roles)                    AS roles,
    (SELECT count(*) FROM permissions)              AS permissions,
    (SELECT count(*) FROM leave_requests)           AS leave_requests,
    (SELECT count(*) FROM attachments)              AS attachments,
    (SELECT count(*) FROM time_entries)             AS time_entries,
    (SELECT count(*) FROM time_correction_requests) AS corrections;
"
