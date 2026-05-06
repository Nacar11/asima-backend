import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase D2: Add source_quotation_item_id to booking_milestones.
 * Links each milestone to the quotation line it was created from (preventive flow).
 */
export class AddSourceQuotationItemIdToBookingMilestones1769600000000
  implements MigrationInterface
{
  name = 'AddSourceQuotationItemIdToBookingMilestones1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "source_quotation_item_id" INTEGER DEFAULT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_booking_milestones_source_quotation_item_id"
      ON "booking_milestones" ("source_quotation_item_id")
      WHERE "source_quotation_item_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_milestones_source_quotation_item_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      DROP COLUMN IF EXISTS "source_quotation_item_id"
    `);
  }
}
