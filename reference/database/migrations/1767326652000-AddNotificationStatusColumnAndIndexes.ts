import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add missing status column and composite indexes to notifications table.
 *
 * Fixes:
 * - Missing status column (defined in entity but not in original migration)
 * - Missing composite index for (user_id, read_at) for unread queries
 * - Missing status index
 *
 * @version 1
 * @since 1.0.0
 */
export class AddNotificationStatusColumnAndIndexes1767326652000
  implements MigrationInterface
{
  name = 'AddNotificationStatusColumnAndIndexes1767326652000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status column if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications' AND column_name = 'status'
        ) THEN
          ALTER TABLE "notifications"
          ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active';
        END IF;
      END $$;
    `);

    // Add composite index for user_id + read_at (common query pattern)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_user_unread"
      ON "notifications" ("user_id", "read_at");
    `);

    // Add status index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_status"
      ON "notifications" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_notifications_status";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_notifications_user_unread";
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" DROP COLUMN IF EXISTS "status";
    `);
  }
}
