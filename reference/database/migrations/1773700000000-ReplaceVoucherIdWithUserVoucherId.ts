import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceVoucherIdWithUserVoucherId1773700000000
  implements MigrationInterface
{
  name = 'ReplaceVoucherIdWithUserVoucherId1773700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==============================
    // VOUCHER_REDEMPTIONS
    // ==============================

    // 1. Add user_voucher_id column (nullable initially)
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ADD COLUMN IF NOT EXISTS "user_voucher_id" integer NULL`,
    );

    // 2. Backfill from user_vouchers matching on voucher_id + user_id
    await queryRunner.query(`
      UPDATE "voucher_redemptions" vr
      SET "user_voucher_id" = (
        SELECT uv.id FROM "user_vouchers" uv
        WHERE uv.voucher_id = vr.voucher_id AND uv.user_id = vr.user_id
        ORDER BY uv.id
        LIMIT 1
      )
      WHERE vr."user_voucher_id" IS NULL
    `);

    // 3. Create user_voucher records for any orphaned redemptions
    await queryRunner.query(`
      INSERT INTO "user_vouchers" (user_id, voucher_id, status, collected_at, used_at)
      SELECT DISTINCT vr.user_id, vr.voucher_id, 'used'::user_vouchers_status_enum, vr.redeemed_at, vr.redeemed_at
      FROM "voucher_redemptions" vr
      WHERE vr."user_voucher_id" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "user_vouchers" uv
          WHERE uv.voucher_id = vr.voucher_id AND uv.user_id = vr.user_id
        )
    `);

    // 4. Backfill again for any newly created user_vouchers
    await queryRunner.query(`
      UPDATE "voucher_redemptions" vr
      SET "user_voucher_id" = (
        SELECT uv.id FROM "user_vouchers" uv
        WHERE uv.voucher_id = vr.voucher_id AND uv.user_id = vr.user_id
        ORDER BY uv.id
        LIMIT 1
      )
      WHERE vr."user_voucher_id" IS NULL
    `);

    // 5. Set NOT NULL
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ALTER COLUMN "user_voucher_id" SET NOT NULL`,
    );

    // 6. Add FK constraint and index
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "FK_voucher_redemptions_user_voucher_id" FOREIGN KEY ("user_voucher_id") REFERENCES "user_vouchers"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_voucher_redemptions_user_voucher_id" ON "voucher_redemptions" ("user_voucher_id")`,
    );

    // 7. Drop old voucher_id column, FK, and index
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" DROP CONSTRAINT IF EXISTS "FK_voucher_redemptions_voucher_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_voucher_redemptions_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" DROP COLUMN IF EXISTS "voucher_id"`,
    );

    // 8. Drop CHECK constraint that required at least one of sales_order_id/booking_id.
    // Onsite QR token redemptions have both NULL.
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" DROP CONSTRAINT IF EXISTS "CHK_voucher_redemptions_has_reference"`,
    );

    // ==============================
    // SALES_ORDER_VOUCHERS
    // ==============================

    // 1. Add user_voucher_id column (nullable initially)
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" ADD COLUMN IF NOT EXISTS "user_voucher_id" integer NULL`,
    );

    // 2. Backfill from user_vouchers via sales_orders.user_id
    await queryRunner.query(`
      UPDATE "sales_order_vouchers" sov
      SET "user_voucher_id" = (
        SELECT uv.id FROM "user_vouchers" uv
        JOIN "sales_orders" so ON so.user_id = uv.user_id
        WHERE uv.voucher_id = sov.voucher_id AND so.id = sov.sales_order_id
        ORDER BY uv.id
        LIMIT 1
      )
      WHERE sov."user_voucher_id" IS NULL
    `);

    // 3. Create user_voucher records for orphaned sales_order_vouchers
    await queryRunner.query(`
      INSERT INTO "user_vouchers" (user_id, voucher_id, status, collected_at, used_at)
      SELECT DISTINCT so.user_id, sov.voucher_id, 'used'::user_vouchers_status_enum, sov.created_at, sov.created_at
      FROM "sales_order_vouchers" sov
      JOIN "sales_orders" so ON so.id = sov.sales_order_id
      WHERE sov."user_voucher_id" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "user_vouchers" uv
          WHERE uv.voucher_id = sov.voucher_id AND uv.user_id = so.user_id
        )
    `);

    // 4. Backfill again
    await queryRunner.query(`
      UPDATE "sales_order_vouchers" sov
      SET "user_voucher_id" = (
        SELECT uv.id FROM "user_vouchers" uv
        JOIN "sales_orders" so ON so.user_id = uv.user_id
        WHERE uv.voucher_id = sov.voucher_id AND so.id = sov.sales_order_id
        ORDER BY uv.id
        LIMIT 1
      )
      WHERE sov."user_voucher_id" IS NULL
    `);

    // 5. Set NOT NULL
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" ALTER COLUMN "user_voucher_id" SET NOT NULL`,
    );

    // 6. Add FK and new unique constraint
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" ADD CONSTRAINT "FK_sales_order_vouchers_user_voucher_id" FOREIGN KEY ("user_voucher_id") REFERENCES "user_vouchers"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sales_order_vouchers_user_voucher_id" ON "sales_order_vouchers" ("user_voucher_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" ADD CONSTRAINT "UQ_sales_order_vouchers_sales_order_id_user_voucher_id" UNIQUE ("sales_order_id", "user_voucher_id")`,
    );

    // 7. Drop old voucher_id column, FK, unique constraint, and index
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" DROP CONSTRAINT IF EXISTS "UQ_sales_order_vouchers_sales_order_id_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" DROP CONSTRAINT IF EXISTS "FK_sales_order_vouchers_voucher_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_order_vouchers_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" DROP COLUMN IF EXISTS "voucher_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ==============================
    // SALES_ORDER_VOUCHERS — restore voucher_id
    // ==============================
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" ADD COLUMN IF NOT EXISTS "voucher_id" integer NULL`,
    );
    await queryRunner.query(`
      UPDATE "sales_order_vouchers" sov
      SET "voucher_id" = (
        SELECT uv.voucher_id FROM "user_vouchers" uv WHERE uv.id = sov.user_voucher_id
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" ALTER COLUMN "voucher_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sales_order_vouchers_voucher_id" ON "sales_order_vouchers" ("voucher_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" ADD CONSTRAINT "UQ_sales_order_vouchers_sales_order_id_voucher_id" UNIQUE ("sales_order_id", "voucher_id")`,
    );

    // Drop new columns/constraints
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" DROP CONSTRAINT IF EXISTS "UQ_sales_order_vouchers_sales_order_id_user_voucher_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_order_vouchers_user_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" DROP CONSTRAINT IF EXISTS "FK_sales_order_vouchers_user_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_vouchers" DROP COLUMN IF EXISTS "user_voucher_id"`,
    );

    // ==============================
    // VOUCHER_REDEMPTIONS — restore voucher_id
    // ==============================
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ADD COLUMN IF NOT EXISTS "voucher_id" integer NULL`,
    );
    await queryRunner.query(`
      UPDATE "voucher_redemptions" vr
      SET "voucher_id" = (
        SELECT uv.voucher_id FROM "user_vouchers" uv WHERE uv.id = vr.user_voucher_id
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ALTER COLUMN "voucher_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_voucher_redemptions_voucher_id" ON "voucher_redemptions" ("voucher_id")`,
    );

    // Drop new columns/constraints
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_voucher_redemptions_user_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" DROP CONSTRAINT IF EXISTS "FK_voucher_redemptions_user_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" DROP COLUMN IF EXISTS "user_voucher_id"`,
    );

    // Restore CHECK constraint requiring at least one reference
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "CHK_voucher_redemptions_has_reference" CHECK (num_nonnulls("sales_order_id", "booking_id") >= 1)`,
    );
  }
}
