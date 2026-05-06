import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add additional_fee_amount and is_active fields to service_areas table.
 *
 * Changes:
 * 1. Add additional_fee_amount column (nullable, for 'fixed' fee type)
 * 2. Add is_active boolean column (default true)
 * 3. Update additional_fee_type enum to include 'none' value
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export class AddServiceAreasAdditionalFields1769200000000
  implements MigrationInterface
{
  name = 'AddServiceAreasAdditionalFields1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add additional_fee_amount column (IF NOT EXISTS for idempotency)
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ADD COLUMN IF NOT EXISTS "additional_fee_amount" NUMERIC(10,2)
    `);

    // Backfill additional_fee_amount from additional_fee for existing records
    await queryRunner.query(`
      UPDATE "service_areas"
      SET "additional_fee_amount" = "additional_fee"
      WHERE "additional_fee" > 0
    `);

    // Add is_active column with default true (IF NOT EXISTS for idempotency)
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT TRUE
    `);

    // Update is_active based on status field
    await queryRunner.query(`
      UPDATE "service_areas"
      SET "is_active" = CASE 
        WHEN LOWER("status") = 'active' THEN TRUE
        ELSE FALSE
      END
    `);

    // Commit the transaction to allow enum modification
    await queryRunner.commitTransaction();

    // Start a new transaction for enum modification
    await queryRunner.startTransaction();

    // Update the enum type to include 'none' value
    // Must be done in a separate transaction
    await queryRunner.query(`
      ALTER TYPE "service_areas_additional_fee_type_enum" 
      ADD VALUE IF NOT EXISTS 'none'
    `);

    // Commit to persist the enum change
    await queryRunner.commitTransaction();

    // Start a new transaction to use the new enum value
    await queryRunner.startTransaction();

    // Update existing records to use 'none' where additional_fee is 0
    await queryRunner.query(`
      UPDATE "service_areas"
      SET "additional_fee_type" = 'none'
      WHERE "additional_fee" = 0 OR "additional_fee" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values
    // Revert records using 'none' back to 'fixed'
    await queryRunner.query(`
      UPDATE "service_areas"
      SET "additional_fee_type" = 'fixed'
      WHERE "additional_fee_type" = 'none'
    `);

    // Remove is_active column
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      DROP COLUMN "is_active"
    `);

    // Remove additional_fee_amount column
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      DROP COLUMN "additional_fee_amount"
    `);
  }
}
