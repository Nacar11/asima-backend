import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add shipping address snapshot columns to sales_orders table.
 *
 * This migration adds columns to store a snapshot of the shipping address
 * at the time of order creation. This ensures historical orders remain
 * accurate even if the user later edits their address book.
 *
 * Per the e-commerce address architecture PRD:
 * - user_address_id: Reference to original address (for tracking only)
 * - shipping_* fields: Immutable snapshot copied at checkout time
 *
 * @version 1
 * @since 1.0.0
 */
export class AlterSalesOrdersAddShippingSnapshot1764742100000
  implements MigrationInterface
{
  name = 'AlterSalesOrdersAddShippingSnapshot1764742100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add user_address_id column (nullable FK to user_addresses)
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "user_address_id" integer
    `);

    // Add shipping snapshot columns
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_recipient_name" character varying(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_phone" character varying(20)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_address_line1" character varying(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_address_line2" character varying(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_city" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_state_province" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_postal_code" character varying(20)
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "shipping_country" character varying(100)
    `);

    // Add foreign key constraint for user_address_id
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD CONSTRAINT "FK_sales_orders_user_address_id"
      FOREIGN KEY ("user_address_id")
      REFERENCES "user_addresses"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Add index on user_address_id
    await queryRunner.query(`
      CREATE INDEX "idx_sales_orders_user_address_id"
      ON "sales_orders" ("user_address_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "idx_sales_orders_user_address_id"`);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP CONSTRAINT "FK_sales_orders_user_address_id"
    `);

    // Drop columns in reverse order
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_country"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_postal_code"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_state_province"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_city"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_address_line2"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_address_line1"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_phone"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "shipping_recipient_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "user_address_id"
    `);
  }
}
