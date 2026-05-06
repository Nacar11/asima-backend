import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add DPO assessment fields to bookings table.
 *
 * Adds is_assessment flag and quotation linking fields for the DPO flow.
 * - is_assessment: true for diagnostic/assessment bookings
 * - quotation_id: links to quote generated FROM this assessment
 * - source_quotation_id: links to quote this booking was created FROM
 * - source_quotation_item_id: specific line item from accepted quotation
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export class AddAssessmentFieldsToBookings1769000100000
  implements MigrationInterface
{
  name = 'AddAssessmentFieldsToBookings1769000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_assessment column
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "is_assessment" BOOLEAN NOT NULL DEFAULT false
    `);

    // Add quotation_id column (quote generated from this assessment)
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "quotation_id" INTEGER
    `);

    // Add source_quotation_id column (quote this booking came from)
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "source_quotation_id" INTEGER
    `);

    // Add source_quotation_item_id column
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "source_quotation_item_id" INTEGER
    `);

    // Add foreign key for quotation_id
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "FK_bookings_quotation_id"
      FOREIGN KEY ("quotation_id") REFERENCES "quote_requests"("id")
      ON DELETE SET NULL
    `);

    // Add foreign key for source_quotation_id
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "FK_bookings_source_quotation_id"
      FOREIGN KEY ("source_quotation_id") REFERENCES "quote_requests"("id")
      ON DELETE SET NULL
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_is_assessment" ON "bookings" ("is_assessment")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_source_quotation_id" ON "bookings" ("source_quotation_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_bookings_source_quotation_id"`);
    await queryRunner.query(`DROP INDEX "IDX_bookings_is_assessment"`);
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_source_quotation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_quotation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "source_quotation_item_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "source_quotation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "quotation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "is_assessment"`,
    );
  }
}
