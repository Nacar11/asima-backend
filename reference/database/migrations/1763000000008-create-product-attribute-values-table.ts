import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductAttributeValuesTable1763000000008
  implements MigrationInterface
{
  name = 'CreateProductAttributeValuesTable1763000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_attribute_values" ("id" SERIAL NOT NULL, "product_variant_id" integer NOT NULL, "product_attribute_id" integer NOT NULL, "attribute_value_id" integer NOT NULL, "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_product_attribute_values_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_attribute_values_product_variant_id" ON "product_attribute_values" (
        "product_variant_id"
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_attribute_values_product_attribute_id" ON "product_attribute_values" (
        "product_attribute_id"
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_attribute_values_attribute_value_id" ON "product_attribute_values" (
        "attribute_value_id"
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "UQ_product_attribute_values_unique" UNIQUE ("product_variant_id", "product_attribute_id", "attribute_value_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_product_attribute_values_product_attribute_id" FOREIGN KEY ("product_attribute_id") REFERENCES "product_attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_product_attribute_values_product_variant_id" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_product_attribute_values_attribute_value_id" FOREIGN KEY ("attribute_value_id") REFERENCES "attribute_values"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_product_attribute_values_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_product_attribute_values_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_product_attribute_values_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_product_attribute_values_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_product_attribute_values_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_product_attribute_values_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_product_attribute_values_attribute_value_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_product_attribute_values_product_variant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_product_attribute_values_product_attribute_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attribute_values" DROP CONSTRAINT "UQ_product_attribute_values_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "idx_product_attribute_values_attribute_value_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "idx_product_attribute_values_product_attribute_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "idx_product_attribute_values_product_variant_id"`,
    );
    await queryRunner.query(`DROP TABLE "product_attribute_values"`);
  }
}
