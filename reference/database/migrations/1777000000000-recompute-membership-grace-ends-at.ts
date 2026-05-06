import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfill `grace_ends_at` for all existing memberships after the semantic
 * flip from "pre-expiry warning trigger" (ends_at - 7) to "post-expiry
 * grace deadline" (ends_at + grace_period).
 *
 * Also reconciles memberships that were mis-flagged GRACE_PERIOD under the
 * old logic (status = GRACE_PERIOD while ends_at is still in the future →
 * those should be ACTIVE under the new semantics).
 */
export class RecomputeMembershipGraceEndsAt1777000000000
  implements MigrationInterface
{
  name = 'RecomputeMembershipGraceEndsAt1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Re-add GRACE_PERIOD to the status enum (removed in 1772 migration).
    // Drop the partial index first — its WHERE clause references the enum type,
    // causing "operator does not exist" when the enum is mid-rename.
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_memberships_user_id_active_or_grace"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."memberships_status_enum" RENAME TO "memberships_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."memberships_status_enum" AS ENUM('PENDING', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(`
      ALTER TABLE "memberships"
      ALTER COLUMN "status" TYPE "public"."memberships_status_enum"
      USING "status"::text::"public"."memberships_status_enum"
    `);
    await queryRunner.query(`DROP TYPE "public"."memberships_status_enum_old"`);
    // Recreate the unique index with GRACE_PERIOD included.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_memberships_user_id_active_or_grace" ON "memberships" ("user_id") WHERE "deleted_at" IS NULL AND "status" IN ('ACTIVE', 'GRACE_PERIOD')`,
    );

    // 1. Recompute grace_ends_at for every non-deleted membership with an
    //    `ends_at` value, using the current `grace_period` parameter
    //    (defaults to 7 if the row is missing).
    await queryRunner.query(`
      WITH p AS (
        SELECT COALESCE(numeric_value, 7)::int AS grace_days
        FROM parameter
        WHERE code = 'grace_period'
          AND deleted_at IS NULL
        LIMIT 1
      )
      UPDATE memberships
      SET grace_ends_at =
        ends_at + (COALESCE((SELECT grace_days FROM p), 7) * INTERVAL '1 day')
      WHERE deleted_at IS NULL
        AND ends_at IS NOT NULL
        AND status IN ('ACTIVE', 'GRACE_PERIOD', 'PENDING', 'CANCELLED');
    `);

    // 2. Reconcile rows that were flagged GRACE_PERIOD under the old
    //    semantics (ends_at still in the future) — those should be ACTIVE.
    await queryRunner.query(`
      UPDATE memberships
      SET status = 'ACTIVE'
      WHERE status = 'GRACE_PERIOD'
        AND ends_at > NOW()
        AND deleted_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove GRACE_PERIOD from the enum, converting any such rows to EXPIRED first.
    await queryRunner.query(`
      UPDATE memberships SET status = 'EXPIRED'
      WHERE status = 'GRACE_PERIOD' AND deleted_at IS NULL
    `);
    // Drop the partial index before the enum rename to avoid "operator does not exist".
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_memberships_user_id_active_or_grace"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."memberships_status_enum" RENAME TO "memberships_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."memberships_status_enum" AS ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(`
      ALTER TABLE "memberships"
      ALTER COLUMN "status" TYPE "public"."memberships_status_enum"
      USING "status"::text::"public"."memberships_status_enum"
    `);
    await queryRunner.query(`DROP TYPE "public"."memberships_status_enum_old"`);
    // Restore the index without GRACE_PERIOD (matches 1772 state).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_memberships_user_id_active_or_grace" ON "memberships" ("user_id") WHERE "deleted_at" IS NULL AND "status" IN ('ACTIVE')`,
    );

    // Restore pre-expiry semantics: grace_ends_at = ends_at - 7.
    // The reconciled status change (GRACE_PERIOD → ACTIVE) is NOT reverted
    // because the old semantics would have re-flagged those rows on the
    // next scheduler run anyway.
    await queryRunner.query(`
      UPDATE memberships
      SET grace_ends_at = ends_at - INTERVAL '7 days'
      WHERE deleted_at IS NULL
        AND ends_at IS NOT NULL
        AND status IN ('ACTIVE', 'GRACE_PERIOD', 'PENDING', 'CANCELLED');
    `);
  }
}
