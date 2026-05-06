import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Integration test for the advisory-lock idempotency pattern used in
 * CheckoutPaymentsService.createOrdersFromPaymentMetadata.
 *
 * Requires a real Postgres test database. We isolate the behavior from the
 * production schema's FK graph by creating a throwaway table whose shape
 * mirrors `checkout_payment_orders` (no FKs). This keeps the test focused on
 * the concurrency property (advisory-lock serialization + post-lock re-check)
 * rather than on assembling a valid user/checkout_order/sales_order chain.
 *
 * Setup (one-time):
 *   createdb -h localhost -U postgres basecode-api-test
 *
 * Run:
 *   DATABASE_NAME=basecode-api-test npx jest src/checkout-payments/__tests__/advisory-lock.integration.spec.ts --runInBand
 *
 * Verifies two independent properties:
 *   1. The advisory-lock primitive serializes concurrent holders keyed by
 *      (classid, payment_id) — a second acquirer blocks until the first
 *      commits, then proceeds.
 *   2. A concurrent second caller that reruns the lock + re-check pattern
 *      observes the first caller's committed rows and skips duplicate
 *      creation.
 */

const ORDER_CREATION_LOCK_CLASSID = 4701;
const FIXTURE_TABLE = 'advisory_lock_test_rows';

const buildDataSource = () =>
  new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'basecode-api-test',
    synchronize: false,
    logging: false,
    entities: [],
    // Each DataSource gets a dedicated pool so two instances in this test
    // really use separate connections (required to exercise lock blocking).
    extra: { max: 2 },
  });

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Advisory-lock idempotency primitive', () => {
  let dsA: DataSource;
  let dsB: DataSource;
  let paymentKey = 0;

  beforeAll(async () => {
    dsA = await buildDataSource().initialize();
    dsB = await buildDataSource().initialize();

    // Create a throwaway table shaped like checkout_payment_orders.
    // No FKs — the test is about lock semantics, not referential integrity.
    await dsA.query(`
      CREATE TABLE IF NOT EXISTS "${FIXTURE_TABLE}" (
        "id" SERIAL PRIMARY KEY,
        "payment_id" integer NOT NULL,
        "sales_order_id" integer NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_${FIXTURE_TABLE}_payment_order"
          UNIQUE ("payment_id", "sales_order_id")
      )
    `);
  }, 60_000);

  afterAll(async () => {
    await dsA?.query(`DROP TABLE IF EXISTS "${FIXTURE_TABLE}"`);
    await dsA?.destroy();
    await dsB?.destroy();
  });

  beforeEach(() => {
    // Unique key per test so cases don't interfere even if cleanup misses.
    paymentKey = Math.floor(Math.random() * 1_000_000_000);
  });

  /**
   * Mirrors the production wrapper:
   *   BEGIN; pg_advisory_xact_lock; re-check; insert-if-absent; COMMIT;
   *
   * Returns the number of rows this caller inserted (0 if it observed
   * existing rows and skipped).
   */
  const simulateWrapper = async (
    ds: DataSource,
    paymentId: number,
    fakeSalesOrderId: number,
  ): Promise<{ created: number; observed: number[] }> => {
    const qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.query('SELECT pg_advisory_xact_lock($1, $2)', [
        ORDER_CREATION_LOCK_CLASSID,
        paymentId,
      ]);

      const existing = await qr.query(
        `SELECT sales_order_id FROM "${FIXTURE_TABLE}"
         WHERE payment_id = $1
         ORDER BY id ASC`,
        [paymentId],
      );

      if (existing.length > 0) {
        await qr.commitTransaction();
        return {
          created: 0,
          observed: existing.map((r: any) => Number(r.sales_order_id)),
        };
      }

      await qr.query(
        `INSERT INTO "${FIXTURE_TABLE}" (payment_id, sales_order_id, is_primary)
         VALUES ($1, $2, true)`,
        [paymentId, fakeSalesOrderId],
      );
      // Simulate downstream work inside the lock so the other caller has a
      // realistic chance to race into acquiring the lock.
      await wait(150);

      await qr.commitTransaction();
      return { created: 1, observed: [fakeSalesOrderId] };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  };

  it('serializes concurrent callers and prevents duplicate rows', async () => {
    const [resultA, resultB] = await Promise.all([
      simulateWrapper(dsA, paymentKey, 1001),
      simulateWrapper(dsB, paymentKey, 1002),
    ]);

    // Exactly one caller created; the other observed and skipped.
    expect(resultA.created + resultB.created).toBe(1);
    const loser = resultA.created === 0 ? resultA : resultB;
    expect(loser.observed).toHaveLength(1);

    const rows = await dsA.query(
      `SELECT COUNT(*)::int AS c FROM "${FIXTURE_TABLE}" WHERE payment_id = $1`,
      [paymentKey],
    );
    expect(rows[0].c).toBe(1);
  }, 30_000);

  it('second caller blocks while first holds the advisory lock, then unblocks on commit', async () => {
    const qr1 = dsA.createQueryRunner();
    await qr1.connect();
    await qr1.startTransaction();
    await qr1.query('SELECT pg_advisory_xact_lock($1, $2)', [
      ORDER_CREATION_LOCK_CLASSID,
      paymentKey,
    ]);

    let secondAcquired = false;
    const secondPromise = (async () => {
      const qr2 = dsB.createQueryRunner();
      await qr2.connect();
      await qr2.startTransaction();
      await qr2.query('SELECT pg_advisory_xact_lock($1, $2)', [
        ORDER_CREATION_LOCK_CLASSID,
        paymentKey,
      ]);
      secondAcquired = true;
      await qr2.commitTransaction();
      await qr2.release();
    })();

    // Give the second caller enough time to attempt the lock.
    await wait(300);
    expect(secondAcquired).toBe(false);

    // Release first holder — second should now proceed.
    await qr1.commitTransaction();
    await qr1.release();

    await secondPromise;
    expect(secondAcquired).toBe(true);
  }, 30_000);
});
