import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVenueServiceType1770600000000 implements MigrationInterface {
  name = 'AddVenueServiceType1770600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add 'venue' to service_type enum
    // Commit the surrounding migration transaction so PostgreSQL can safely
    // use the new enum label in later pending migrations during the same run.
    if (queryRunner.isTransactionActive) {
      await queryRunner.commitTransaction();
    }
    await queryRunner.startTransaction();

    await queryRunner.query(`
      ALTER TYPE "service_type_enum"
      ADD VALUE IF NOT EXISTS 'venue'
    `);

    // Persist the enum label before any later migration references it.
    if (queryRunner.isTransactionActive) {
      await queryRunner.commitTransaction();
    }
    await queryRunner.startTransaction();

    // 2. Add venue configuration columns
    await queryRunner.query(`
      ALTER TABLE "services"
      ADD COLUMN IF NOT EXISTS "venue_capacity" integer DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "slot_duration_minutes" integer DEFAULT NULL
    `);

    // 3. Add peak pricing columns
    await queryRunner.query(`
      ALTER TABLE "services"
      ADD COLUMN IF NOT EXISTS "peak_price_multiplier" decimal(4,2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "peak_days" text DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "peak_start_time" time DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "peak_end_time" time DEFAULT NULL
    `);

    // 4. Add scheduled_end_time to shopping_cart_items (for venue multi-slot bookings)
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD COLUMN IF NOT EXISTS "scheduled_end_time" time DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop scheduled_end_time from shopping_cart_items
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      DROP COLUMN IF EXISTS "scheduled_end_time"
    `);

    // Drop peak pricing columns
    await queryRunner.query(`
      ALTER TABLE "services"
      DROP COLUMN IF EXISTS "peak_end_time",
      DROP COLUMN IF EXISTS "peak_start_time",
      DROP COLUMN IF EXISTS "peak_days",
      DROP COLUMN IF EXISTS "peak_price_multiplier"
    `);

    // Drop venue configuration columns
    await queryRunner.query(`
      ALTER TABLE "services"
      DROP COLUMN IF EXISTS "slot_duration_minutes",
      DROP COLUMN IF EXISTS "venue_capacity"
    `);

    // Note: Cannot remove enum value in PostgreSQL without recreating the type.
    // 'venue' value left in enum; it's harmless if unused.
  }
}
