import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add service fields to shopping_cart_items table.
 *
 * This migration extends the shopping_cart_items table to support service items
 * in addition to product items. Adds service_id, package_id, scheduled_date,
 * scheduled_start_time, and item_type fields. Makes variant_id nullable to
 * support both product and service items.
 *
 * @version 1
 * @since 1.0.0
 */
export class AddServiceFieldsToShoppingCartItems1765429000000
  implements MigrationInterface
{
  name = 'AddServiceFieldsToShoppingCartItems1765429000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create item_type enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "shopping_cart_items_item_type_enum" AS ENUM('product', 'service');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add new columns
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD COLUMN IF NOT EXISTS "service_id" integer,
      ADD COLUMN IF NOT EXISTS "package_id" integer,
      ADD COLUMN IF NOT EXISTS "scheduled_date" date,
      ADD COLUMN IF NOT EXISTS "scheduled_start_time" time,
      ADD COLUMN IF NOT EXISTS "item_type" "shopping_cart_items_item_type_enum" DEFAULT 'product'
    `);

    // Make variant_id nullable
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ALTER COLUMN "variant_id" DROP NOT NULL
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD CONSTRAINT "FK_shopping_cart_items_service"
        FOREIGN KEY ("service_id")
        REFERENCES "services"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD CONSTRAINT "FK_shopping_cart_items_package"
        FOREIGN KEY ("package_id")
        REFERENCES "service_packages"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_shopping_cart_items_service_id"
      ON "shopping_cart_items" ("service_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_shopping_cart_items_package_id"
      ON "shopping_cart_items" ("package_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_shopping_cart_items_item_type"
      ON "shopping_cart_items" ("item_type")
    `);

    // Update existing items to have item_type = 'product'
    await queryRunner.query(`
      UPDATE "shopping_cart_items"
      SET "item_type" = 'product'
      WHERE "item_type" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_shopping_cart_items_item_type"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_shopping_cart_items_package_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_shopping_cart_items_service_id"
    `);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      DROP CONSTRAINT IF EXISTS "FK_shopping_cart_items_package"
    `);

    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      DROP CONSTRAINT IF EXISTS "FK_shopping_cart_items_service"
    `);

    // Make variant_id NOT NULL again (only if no null values exist)
    await queryRunner.query(`
      UPDATE "shopping_cart_items"
      SET "variant_id" = 0
      WHERE "variant_id" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ALTER COLUMN "variant_id" SET NOT NULL
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      DROP COLUMN IF EXISTS "item_type",
      DROP COLUMN IF EXISTS "scheduled_start_time",
      DROP COLUMN IF EXISTS "scheduled_date",
      DROP COLUMN IF EXISTS "package_id",
      DROP COLUMN IF EXISTS "service_id"
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "shopping_cart_items_item_type_enum"
    `);
  }
}
