import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add service support to sales_order_items table.
 *
 * This migration extends the sales_order_items table to support service items
 * in addition to product items. Makes variant_id nullable, adds service_id,
 * item_type, and service-specific fields (scheduled_date, scheduled_start_time,
 * service_address_id, special_requests, location_additional_fee).
 *
 * @version 1
 * @since 1.0.0
 */
export class AddServiceSupportToSalesOrderItems1767590430000
  implements MigrationInterface
{
  name = 'AddServiceSupportToSalesOrderItems1767590430000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create item_type enum if it doesn't exist (reuse from shopping_cart_items)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sales_order_items_item_type_enum" AS ENUM('product', 'service');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add new columns
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD COLUMN IF NOT EXISTS "service_id" integer,
      ADD COLUMN IF NOT EXISTS "package_id" integer,
      ADD COLUMN IF NOT EXISTS "item_type" "sales_order_items_item_type_enum" DEFAULT 'product',
      ADD COLUMN IF NOT EXISTS "scheduled_date" date,
      ADD COLUMN IF NOT EXISTS "scheduled_start_time" time,
      ADD COLUMN IF NOT EXISTS "service_address_id" integer,
      ADD COLUMN IF NOT EXISTS "special_requests" text,
      ADD COLUMN IF NOT EXISTS "location_additional_fee" numeric(10,2) DEFAULT 0
    `);

    // Make variant_id nullable (service items don't have variants)
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ALTER COLUMN "variant_id" DROP NOT NULL
    `);

    // Drop the old foreign key constraint on variant_id (since it's now nullable)
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP CONSTRAINT IF EXISTS "FK_sales_order_items_variant_id"
    `);

    // Recreate foreign key constraint with nullable support
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD CONSTRAINT "FK_sales_order_items_variant_id"
        FOREIGN KEY ("variant_id")
        REFERENCES "product_variants"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);

    // Add foreign key constraints for service-related fields
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD CONSTRAINT "FK_sales_order_items_service_id"
        FOREIGN KEY ("service_id")
        REFERENCES "services"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD CONSTRAINT "FK_sales_order_items_package_id"
        FOREIGN KEY ("package_id")
        REFERENCES "service_packages"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD CONSTRAINT "FK_sales_order_items_service_address_id"
        FOREIGN KEY ("service_address_id")
        REFERENCES "user_addresses"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION
    `);

    // Add indexes for new columns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_order_items_service_id"
      ON "sales_order_items" ("service_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_order_items_item_type"
      ON "sales_order_items" ("item_type")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_order_items_order_item_type"
      ON "sales_order_items" ("order_id", "item_type")
    `);

    // Add check constraint to ensure either variant_id or service_id is set
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD CONSTRAINT "CHK_sales_order_items_variant_or_service"
        CHECK (
          (item_type = 'product' AND variant_id IS NOT NULL AND service_id IS NULL) OR
          (item_type = 'service' AND service_id IS NOT NULL AND variant_id IS NULL)
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraint
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP CONSTRAINT IF EXISTS "CHK_sales_order_items_variant_or_service"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_sales_order_items_order_item_type"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_sales_order_items_item_type"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_sales_order_items_service_id"
    `);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP CONSTRAINT IF EXISTS "FK_sales_order_items_service_address_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP CONSTRAINT IF EXISTS "FK_sales_order_items_package_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP CONSTRAINT IF EXISTS "FK_sales_order_items_service_id"
    `);

    // Drop the variant_id foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP CONSTRAINT IF EXISTS "FK_sales_order_items_variant_id"
    `);

    // Make variant_id NOT NULL again
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ALTER COLUMN "variant_id" SET NOT NULL
    `);

    // Recreate the variant_id foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD CONSTRAINT "FK_sales_order_items_variant_id"
        FOREIGN KEY ("variant_id")
        REFERENCES "product_variants"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP COLUMN IF EXISTS "location_additional_fee",
      DROP COLUMN IF EXISTS "special_requests",
      DROP COLUMN IF EXISTS "service_address_id",
      DROP COLUMN IF EXISTS "scheduled_start_time",
      DROP COLUMN IF EXISTS "scheduled_date",
      DROP COLUMN IF EXISTS "item_type",
      DROP COLUMN IF EXISTS "package_id",
      DROP COLUMN IF EXISTS "service_id"
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "sales_order_items_item_type_enum"
    `);
  }
}
