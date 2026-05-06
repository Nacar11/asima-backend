import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add admin management fields to sales_orders table.
 *
 * Adds the following columns:
 * - seller_id: Foreign key to sellers table for store assignment
 * - shipping_address: Full shipping address
 * - tracking_number: Shipment tracking number
 * - shipping_provider: Name of shipping provider (FedEx, UPS, etc.)
 * - shipped_at: Timestamp when order was shipped
 * - delivered_at: Timestamp when order was delivered
 * - cancellation_reason: Reason for order cancellation
 * - cancelled_at: Timestamp when order was cancelled
 *
 * @version 1
 * @since 1.0.0
 */
export class AlterSalesOrdersAddAdminFields1764100000001
  implements MigrationInterface
{
  name = 'AlterSalesOrdersAddAdminFields1764100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add seller_id column with foreign key to sellers
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "seller_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD CONSTRAINT "FK_sales_orders_seller_id"
      FOREIGN KEY ("seller_id")
      REFERENCES "sellers"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Add shipping address column
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_address" text
    `);

    // Add tracking/shipping columns
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "tracking_number" varchar(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_provider" varchar(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipped_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "delivered_at" TIMESTAMP
    `);

    // Add cancellation columns
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "cancellation_reason" text
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "cancelled_at" TIMESTAMP
    `);

    // Add index on seller_id for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_orders_seller_id"
      ON "sales_orders" ("seller_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_sales_orders_seller_id"`);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP CONSTRAINT "FK_sales_orders_seller_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "cancelled_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "cancellation_reason"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "delivered_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipped_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_provider"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "tracking_number"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_address"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "seller_id"
    `);
  }
}
