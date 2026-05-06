import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add created_by and updated_by columns to booking_cancellations table.
 *
 * This migration adds the missing audit columns (created_by, updated_by) that are
 * part of the entity definition but were missing from the initial migration.
 *
 * @version 1
 * @since 1.0.0
 */
export class AddAuditColumnsToBookingCancellations1765511000000
  implements MigrationInterface
{
  name = 'AddAuditColumnsToBookingCancellations1765511000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add created_by column
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      ADD COLUMN "created_by" integer;
    `);

    // Add foreign key constraint for created_by
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      ADD CONSTRAINT "FK_booking_cancellations_created_by"
        FOREIGN KEY ("created_by")
        REFERENCES "user"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
    `);

    // Add updated_by column
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      ADD COLUMN "updated_by" integer;
    `);

    // Add foreign key constraint for updated_by
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      ADD CONSTRAINT "FK_booking_cancellations_updated_by"
        FOREIGN KEY ("updated_by")
        REFERENCES "user"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
    `);

    // Add foreign key constraint for deleted_by
    // (deleted_by column already exists from the initial migration, but FK is missing)
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      ADD CONSTRAINT "FK_booking_cancellations_deleted_by"
        FOREIGN KEY ("deleted_by")
        REFERENCES "user"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint for deleted_by (only if we added it)
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      DROP CONSTRAINT IF EXISTS "FK_booking_cancellations_deleted_by";
    `);

    // Drop foreign key constraint for updated_by
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      DROP CONSTRAINT IF EXISTS "FK_booking_cancellations_updated_by";
    `);

    // Drop updated_by column
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      DROP COLUMN IF EXISTS "updated_by";
    `);

    // Drop foreign key constraint for created_by
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      DROP CONSTRAINT IF EXISTS "FK_booking_cancellations_created_by";
    `);

    // Drop created_by column
    await queryRunner.query(`
      ALTER TABLE "booking_cancellations"
      DROP COLUMN IF EXISTS "created_by";
    `);
  }
}
