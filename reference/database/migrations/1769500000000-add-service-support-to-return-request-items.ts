import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add service support to return_request_items table.
 *
 * This migration extends the return_request_items table to support service items
 * in addition to product items. Makes variant_id nullable and adds service_id
 * to allow returning both product and service items.
 *
 * @version 1
 * @since 1.0.0
 */
export class AddServiceSupportToReturnRequestItems1769500000000
  implements MigrationInterface
{
  name = 'AddServiceSupportToReturnRequestItems1769500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old foreign key constraint on variant_id (will recreate as nullable)
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      DROP CONSTRAINT IF EXISTS "FK_return_request_items_variant_id"
    `);

    // Make variant_id nullable (service items don't have variants)
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ALTER COLUMN "variant_id" DROP NOT NULL
    `);

    // Recreate foreign key constraint with nullable support
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "FK_return_request_items_variant_id"
        FOREIGN KEY ("variant_id")
        REFERENCES "product_variants"("id")
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
    `);

    // Add service_id column
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD COLUMN IF NOT EXISTS "service_id" integer
    `);

    // Add foreign key constraint for service_id
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "FK_return_request_items_service_id"
        FOREIGN KEY ("service_id")
        REFERENCES "services"("id")
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
    `);

    // Add index for service_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_return_request_items_service_id"
      ON "return_request_items" ("service_id")
    `);

    // Add check constraint to ensure either variant_id or service_id is set
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "CHK_return_request_items_variant_or_service"
        CHECK (
          (variant_id IS NOT NULL AND service_id IS NULL) OR
          (service_id IS NOT NULL AND variant_id IS NULL)
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraint
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      DROP CONSTRAINT IF EXISTS "CHK_return_request_items_variant_or_service"
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_return_request_items_service_id"
    `);

    // Drop foreign key constraint for service_id
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      DROP CONSTRAINT IF EXISTS "FK_return_request_items_service_id"
    `);

    // Drop service_id column
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      DROP COLUMN IF EXISTS "service_id"
    `);

    // Drop the variant_id foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      DROP CONSTRAINT IF EXISTS "FK_return_request_items_variant_id"
    `);

    // Make variant_id NOT NULL again
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ALTER COLUMN "variant_id" SET NOT NULL
    `);

    // Recreate the variant_id foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "FK_return_request_items_variant_id"
        FOREIGN KEY ("variant_id")
        REFERENCES "product_variants"("id")
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
    `);
  }
}
