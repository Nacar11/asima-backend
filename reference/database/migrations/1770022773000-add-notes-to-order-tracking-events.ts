import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add notes column to order_tracking_events table.
 *
 * This column allows storing additional notes/comments for each
 * tracking event, separate from the auto-generated description.
 */
export class AddNotesToOrderTrackingEvents1770022773000
  implements MigrationInterface
{
  name = 'AddNotesToOrderTrackingEvents1770022773000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_tracking_events"
      ADD COLUMN "notes" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_tracking_events"
      DROP COLUMN "notes"
    `);
  }
}
