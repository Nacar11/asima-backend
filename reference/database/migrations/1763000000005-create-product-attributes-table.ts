import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductAttributesTable1763000000005
  implements MigrationInterface
{
  name = 'CreateProductAttributesTable1763000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_attributes" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "attribute_id" integer NOT NULL, "attribute_value_ids" integer[], "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_product_attributes_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_attributes_product_id" ON "product_attributes" ("product_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_attributes_attribute_id" ON "product_attributes" ("attribute_id")`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_product_attributes_unique" ON "product_attributes" ("product_id", "attribute_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_attribute_id" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_product_attributes_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_product_attributes_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_product_attributes_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_product_attributes_attribute_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_product_attributes_product_id"`,
    );
    await queryRunner.query(`DROP INDEX "idx_product_attributes_unique"`);
    await queryRunner.query(`DROP INDEX "idx_product_attributes_attribute_id"`);
    await queryRunner.query(`DROP INDEX "idx_product_attributes_product_id"`);
    await queryRunner.query(`DROP TABLE "product_attributes"`);
  }
}
