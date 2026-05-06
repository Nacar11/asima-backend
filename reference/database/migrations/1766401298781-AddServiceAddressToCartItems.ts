import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddServiceAddressToCartItems
 *
 * Adds service_address_id and special_requests columns to shopping_cart_items
 * to support unified cart functionality for services (TRV-010).
 *
 * @since 1.0.0
 */
export class AddServiceAddressToCartItems1766401298781
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add service_address_id column
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD COLUMN IF NOT EXISTS "service_address_id" integer NULL
    `);

    // Add special_requests column
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD COLUMN IF NOT EXISTS "special_requests" text NULL
    `);

    // Add foreign key constraint for service_address_id
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD CONSTRAINT "FK_shopping_cart_items_service_address_id"
      FOREIGN KEY ("service_address_id")
      REFERENCES "user_addresses"("id")
      ON DELETE SET NULL
    `);

    // Add index for service_address_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_shopping_cart_items_service_address_id"
      ON "shopping_cart_items" ("service_address_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_shopping_cart_items_service_address_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shopping_cart_items" DROP CONSTRAINT IF EXISTS "FK_shopping_cart_items_service_address_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shopping_cart_items" DROP COLUMN IF EXISTS "special_requests"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shopping_cart_items" DROP COLUMN IF EXISTS "service_address_id"`,
    );
  }
}
