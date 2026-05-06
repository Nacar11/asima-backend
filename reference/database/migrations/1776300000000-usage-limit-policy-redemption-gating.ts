import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * § 10 — Usage-limit policy: redemption-based gating
 *
 * 1. Make per_user_limit nullable (non-claimable vouchers store NULL).
 * 2. Add CHECK constraints for per_user_limit and total_limit/used_count.
 * 3. Normalise existing non-claimable rows → both limits NULL.
 * 4. Add composite index to support per-user redemption COUNT in the gate.
 */
export class UsageLimitPolicyRedemptionGating1776300000000
  implements MigrationInterface {
  name = 'UsageLimitPolicyRedemptionGating1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Make per_user_limit nullable
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "per_user_limit" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "per_user_limit" DROP DEFAULT`,
    );

    // 2. CHECK: per_user_limit is either NULL or > 0
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD CONSTRAINT "CHK_vouchers_per_user_limit" CHECK ("per_user_limit" IS NULL OR "per_user_limit" > 0)`,
    );

    // 3. CHECK: total_limit is either NULL or used_count does not exceed it
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD CONSTRAINT "CHK_vouchers_total_limit_used_count" CHECK ("total_limit" IS NULL OR "used_count" <= "total_limit")`,
    );

    // 4. Normalise existing non-claimable rows (limits and validity dates should be null)
    await queryRunner.query(
      `UPDATE "vouchers" SET "total_limit" = NULL, "per_user_limit" = NULL, "starts_at" = NULL, "expires_at" = NULL WHERE "is_claimable" = false`,
    );

    // 5. Composite index for per-user redemption COUNT in the gate
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_vouchers_voucher_user_status" ON "user_vouchers" ("voucher_id", "user_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_user_vouchers_voucher_user_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT IF EXISTS "CHK_vouchers_total_limit_used_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT IF EXISTS "CHK_vouchers_per_user_limit"`,
    );

    // Restore NOT NULL — set existing NULLs to 1 first
    await queryRunner.query(
      `UPDATE "vouchers" SET "per_user_limit" = 1 WHERE "per_user_limit" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "per_user_limit" SET DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "per_user_limit" SET NOT NULL`,
    );
  }
}
