import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeduplicateMembershipsAndAddUniquePerUser1775700000000
  implements MigrationInterface
{
  name = 'DeduplicateMembershipsAndAddUniquePerUser1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: For each user with multiple non-deleted memberships, soft-delete all
    // except the most recent row (highest id). Also cancel orphaned payments.
    await queryRunner.query(`
      WITH duplicates AS (
        SELECT id, user_id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id DESC) AS rn
        FROM memberships
        WHERE deleted_at IS NULL
      ),
      to_delete AS (
        SELECT id FROM duplicates WHERE rn > 1
      )
      UPDATE membership_payments
      SET payment_status = 'CANCELLED',
          updated_at = NOW()
      WHERE membership_id IN (SELECT id FROM to_delete)
        AND payment_status = 'PENDING'
    `);

    await queryRunner.query(`
      WITH duplicates AS (
        SELECT id, user_id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id DESC) AS rn
        FROM memberships
        WHERE deleted_at IS NULL
      )
      UPDATE memberships
      SET deleted_at = NOW(),
          updated_at = NOW()
      WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
    `);

    // Step 2: Add unique constraint — one non-deleted membership row per user
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_memberships_one_per_user"
      ON "memberships" ("user_id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_memberships_one_per_user"`,
    );
  }
}
