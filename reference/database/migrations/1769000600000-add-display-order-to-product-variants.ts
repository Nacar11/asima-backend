import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisplayOrderToProductVariants1769000600000
  implements MigrationInterface
{
  name = 'AddDisplayOrderToProductVariants1769000600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP COLUMN "display_order"`,
    );
  }
}
