import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderItemSnapshots1764742300000 implements MigrationInterface {
  name = 'AddOrderItemSnapshots1764742300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status_notes and shipping_method to sales_orders
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN IF NOT EXISTS "status_notes" text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN IF NOT EXISTS "shipping_method" varchar(100) NULL
    `);

    // Add snapshot fields to sales_order_items
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD COLUMN IF NOT EXISTS "sku" varchar(100) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD COLUMN IF NOT EXISTS "variant_name" varchar(255) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD COLUMN IF NOT EXISTS "product_name" varchar(255) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD COLUMN IF NOT EXISTS "product_image_url" varchar(500) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD COLUMN IF NOT EXISTS "variant_image_url" varchar(500) NULL
    `);

    // Backfill existing order items with current variant data
    // Note: Images are stored in media table, accessed via:
    // - product_media_mappings for products (with is_primary flag)
    // - media_id on product_variants
    await queryRunner.query(`
      UPDATE "sales_order_items" soi
      SET
        "sku" = pv."sku",
        "variant_name" = pv."variant_name",
        "product_name" = p."product_name",
        "product_image_url" = (
          SELECT COALESCE(m.compressed_path, m.file_path)
          FROM product_media_mappings pmm
          JOIN media m ON m.id = pmm.media_id
          WHERE pmm.product_id = p.id
          ORDER BY pmm.is_primary DESC, pmm.display_order ASC
          LIMIT 1
        ),
        "variant_image_url" = (
          SELECT COALESCE(m.compressed_path, m.file_path)
          FROM media m
          WHERE m.id = pv.media_id
        )
      FROM "product_variants" pv
      LEFT JOIN "products" p ON p."id" = pv."product_id"
      WHERE soi."variant_id" = pv."id"
        AND soi."sku" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove snapshot fields from sales_order_items
    await queryRunner.query(`
      ALTER TABLE "sales_order_items" DROP COLUMN IF EXISTS "variant_image_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items" DROP COLUMN IF EXISTS "product_image_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items" DROP COLUMN IF EXISTS "product_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items" DROP COLUMN IF EXISTS "variant_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_items" DROP COLUMN IF EXISTS "sku"
    `);

    // Remove fields from sales_orders
    await queryRunner.query(`
      ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "shipping_method"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "status_notes"
    `);
  }
}
