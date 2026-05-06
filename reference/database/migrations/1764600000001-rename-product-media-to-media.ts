import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameProductMediaToMedia1764600000001
  implements MigrationInterface
{
  name = 'RenameProductMediaToMedia1764600000001';

  /**
   * Migration Purpose: Rename product_media table to media
   * - Renames table: product_media → media
   * - Updates all associated indexes and constraints for product_media table only
   * - Maintains all relationships and data integrity
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename the table from product_media to media
    await queryRunner.query(`ALTER TABLE "product_media" RENAME TO "media"`);

    // Rename indexes - using the actual index names from the create migration
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_product_media_media_type" RENAME TO "IDX_media_media_type"`,
    );
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_product_media_seller_id" RENAME TO "IDX_media_seller_id"`,
    );
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_product_media_processing_status" RENAME TO "IDX_media_processing_status"`,
    );
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_product_media_status" RENAME TO "IDX_media_status"`,
    );

    // Rename the primary key constraint
    await queryRunner.query(
      `ALTER TABLE "media" RENAME CONSTRAINT "PK_product_media" TO "PK_media"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename the primary key constraint back
    await queryRunner.query(
      `ALTER TABLE "media" RENAME CONSTRAINT "PK_media" TO "PK_product_media"`,
    );

    // Rename indexes back
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_media_status" RENAME TO "IDX_product_media_status"`,
    );
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_media_processing_status" RENAME TO "IDX_product_media_processing_status"`,
    );
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_media_seller_id" RENAME TO "IDX_product_media_seller_id"`,
    );
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_media_media_type" RENAME TO "IDX_product_media_media_type"`,
    );

    // Rename the table back from media to product_media
    await queryRunner.query(`ALTER TABLE "media" RENAME TO "product_media"`);
  }
}
