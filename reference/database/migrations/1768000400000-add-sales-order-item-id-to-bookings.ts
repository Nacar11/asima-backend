import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add sales_order_item_id to bookings table.
 *
 * This links bookings directly to sales order items (source of truth)
 * instead of checkout orders (deprecated).
 *
 * Changes:
 * - Add sales_order_item_id column (nullable for backward compatibility)
 * - Add sales_order_id column for quick lookups
 * - Make checkout_order_id nullable (deprecated, kept for backward compatibility)
 * - Add foreign key and index
 */
export class AddSalesOrderItemIdToBookings1768000400000
  implements MigrationInterface
{
  name = 'AddSalesOrderItemIdToBookings1768000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add sales_order_item_id column (nullable for backward compatibility)
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD COLUMN "sales_order_item_id" integer
    `);

    // 2. Add sales_order_id column for quick lookups (nullable)
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD COLUMN "sales_order_id" integer
    `);

    // 3. Make checkout_order_id nullable (deprecated)
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "checkout_order_id" DROP NOT NULL
    `);

    // 4. Add foreign key for sales_order_item_id
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "FK_bookings_sales_order_item" 
      FOREIGN KEY ("sales_order_item_id") 
      REFERENCES "sales_order_items"("id") 
      ON DELETE SET NULL
    `);

    // 5. Add foreign key for sales_order_id
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "FK_bookings_sales_order" 
      FOREIGN KEY ("sales_order_id") 
      REFERENCES "sales_orders"("id") 
      ON DELETE SET NULL
    `);

    // 6. Add indexes for the new columns
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_sales_order_item_id" 
      ON "bookings" ("sales_order_item_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_sales_order_id" 
      ON "bookings" ("sales_order_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_sales_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_sales_order_item_id"`,
    );

    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP CONSTRAINT IF EXISTS "FK_bookings_sales_order"
    `);
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP CONSTRAINT IF EXISTS "FK_bookings_sales_order_item"
    `);

    // Make checkout_order_id NOT NULL again
    // Note: This might fail if there are rows with NULL checkout_order_id
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "checkout_order_id" SET NOT NULL
    `);

    // Drop the new columns
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP COLUMN "sales_order_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP COLUMN "sales_order_item_id"
    `);
  }
}
