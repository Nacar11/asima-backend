import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add listing_type enum to products table.
 *
 * Distinguishes between marketplace products and internal materials.
 * Materials are used for quotation line items but not visible on marketplace.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export class AddListingTypeToProducts1769000400000
  implements MigrationInterface
{
  name = 'AddListingTypeToProducts1769000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the enum type
    await queryRunner.query(`
      CREATE TYPE "listing_type_enum" AS ENUM ('product', 'material')
    `);

    // Add the column with default value
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "listing_type" "listing_type_enum" NOT NULL DEFAULT 'product'
    `);

    // Add index for filtering by listing type
    await queryRunner.query(`
      CREATE INDEX "IDX_products_listing_type" ON "products" ("listing_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_products_listing_type"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "listing_type"`,
    );
    await queryRunner.query(`DROP TYPE "listing_type_enum"`);
  }
}
