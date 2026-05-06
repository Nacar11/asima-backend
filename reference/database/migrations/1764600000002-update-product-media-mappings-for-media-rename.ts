import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductMediaMappingsForMediaRename1764600000002
  implements MigrationInterface
{
  name = 'UpdateProductMediaMappingsForMediaRename1764600000002';

  /**
   * Migration Purpose: Add missing foreign key constraint for media_mappings
   * - Adds product_id FK to product_media_mappings
   * - Ensures referential integrity with products table
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add foreign key constraint for product_id in media_mappings (renamed from product_media_mappings)
    await queryRunner.query(
      `ALTER TABLE "product_media_mappings" ADD CONSTRAINT "FK_product_media_mappings_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint for product_id
    await queryRunner.query(
      `ALTER TABLE "product_media_mappings" DROP CONSTRAINT "FK_product_media_mappings_product_id"`,
    );
  }
}
