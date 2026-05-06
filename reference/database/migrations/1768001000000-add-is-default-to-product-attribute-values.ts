import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDefaultToProductAttributeValues1768001000000
  implements MigrationInterface
{
  name = 'AddIsDefaultToProductAttributeValues1768001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD COLUMN "is_default" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_attribute_values_is_default" ON "product_attribute_values" ("is_default")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_product_attribute_values_is_default"`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP COLUMN "is_default"`,
    );
  }
}
