import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to fix timestamp consistency in user_device_tokens table.
 *
 * Changes TIMESTAMP columns to TIMESTAMP WITH TIME ZONE for consistency
 * with other tables in the database.
 *
 * @version 1
 * @since 1.0.0
 */
export class FixUserDeviceTokensTimestamps1767326653000
  implements MigrationInterface
{
  name = 'FixUserDeviceTokensTimestamps1767326653000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alter columns to use TIMESTAMP WITH TIME ZONE
    await queryRunner.query(`
      ALTER TABLE "user_device_tokens"
      ALTER COLUMN "last_used_at" TYPE TIMESTAMP WITH TIME ZONE;
    `);

    await queryRunner.query(`
      ALTER TABLE "user_device_tokens"
      ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE;
    `);

    await queryRunner.query(`
      ALTER TABLE "user_device_tokens"
      ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to TIMESTAMP without timezone
    await queryRunner.query(`
      ALTER TABLE "user_device_tokens"
      ALTER COLUMN "updated_at" TYPE TIMESTAMP;
    `);

    await queryRunner.query(`
      ALTER TABLE "user_device_tokens"
      ALTER COLUMN "created_at" TYPE TIMESTAMP;
    `);

    await queryRunner.query(`
      ALTER TABLE "user_device_tokens"
      ALTER COLUMN "last_used_at" TYPE TIMESTAMP;
    `);
  }
}
