import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add deleted_by column to bookings table.
 *
 * This migration adds the missing deleted_by column that is part of
 * BaseEntityHelper but was missing from the initial bookings migration.
 *
 * @version 1
 * @since 1.0.0
 */
export class AddDeletedByToBookings1765441000000 implements MigrationInterface {
  name = 'AddDeletedByToBookings1765441000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deleted_by column
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "deleted_by" integer;
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "FK_bookings_deleted_by"
        FOREIGN KEY ("deleted_by")
        REFERENCES "user"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "FK_bookings_deleted_by";
    `);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "deleted_by";
    `);
  }
}
