# requested_refund_amount Validation Queries

Use these read-only checks to validate dispute records after deployment.

## 1) Quick summary

```sql
SELECT
  COUNT(*) AS total_disputes,
  COUNT(*) FILTER (WHERE requested_refund_amount IS NULL) AS null_requested_refund_amount,
  COUNT(*) FILTER (WHERE requested_refund_amount IS NOT NULL) AS with_requested_refund_amount,
  COUNT(*) FILTER (WHERE requested_refund_amount < 0) AS negative_requested_refund_amount
FROM disputes;
```

## 2) Recent records snapshot

```sql
SELECT
  id,
  dispute_number,
  requested_resolution,
  requested_refund_amount,
  created_at,
  updated_at
FROM disputes
ORDER BY created_at DESC
LIMIT 100;
```

## 3) Partial refund disputes missing amount

```sql
SELECT
  id,
  dispute_number,
  requested_resolution,
  requested_refund_amount,
  created_at
FROM disputes
WHERE requested_resolution = 'partial_refund'
  AND requested_refund_amount IS NULL
ORDER BY created_at DESC;
```

## 4) Optional backfill preview (no write)

```sql
SELECT
  id,
  dispute_number,
  requested_refund_amount,
  booking_id
FROM disputes
WHERE requested_resolution = 'partial_refund'
  AND requested_refund_amount IS NULL;
```

## 5) Optional transactional backfill template (manual)

Only run this after business review of each row.

```sql
BEGIN;

-- Example only: replace amount and WHERE clause per approved records.
-- UPDATE disputes
-- SET requested_refund_amount = 1000.00,
--     updated_at = NOW()
-- WHERE id = 123
--   AND requested_refund_amount IS NULL;

-- Inspect before commit.
-- SELECT id, dispute_number, requested_refund_amount FROM disputes WHERE id = 123;

ROLLBACK;
-- Change to COMMIT only after validation and explicit approval.
```
