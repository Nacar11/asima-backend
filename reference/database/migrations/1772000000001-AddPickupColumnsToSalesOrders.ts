import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPickupColumnsToSalesOrders1772000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "fulfillment_type" VARCHAR(20) NOT NULL DEFAULT 'delivery',
      ADD COLUMN "pickup_date" DATE NULL,
      ADD COLUMN "pickup_time" TIME NULL,
      ADD COLUMN "pickup_notes" VARCHAR(255) NULL,
      ADD COLUMN "ready_for_pickup_at" TIMESTAMPTZ NULL,
      ADD COLUMN "picked_up_at" TIMESTAMPTZ NULL,
      ADD COLUMN "pickup_reminder_notified_at" TIMESTAMPTZ NULL,
      ADD COLUMN "noshow_warning_1_notified_at" TIMESTAMPTZ NULL,
      ADD COLUMN "noshow_warning_2_notified_at" TIMESTAMPTZ NULL,
      ADD COLUMN "grace_period_extension" INTEGER NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sales_orders_fulfillment_type" ON "sales_orders"("fulfillment_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sales_orders_pickup_date" 
      ON "sales_orders"("pickup_date") 
      WHERE "fulfillment_type" = 'pickup'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sales_orders_fulfillment_type"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sales_orders_pickup_date"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "fulfillment_type",
      DROP COLUMN "pickup_date",
      DROP COLUMN "pickup_time",
      DROP COLUMN "pickup_notes",
      DROP COLUMN "ready_for_pickup_at",
      DROP COLUMN "picked_up_at",
      DROP COLUMN "pickup_reminder_notified_at",
      DROP COLUMN "noshow_warning_1_notified_at",
      DROP COLUMN "noshow_warning_2_notified_at",
      DROP COLUMN "grace_period_extension"
    `);
  }
}
