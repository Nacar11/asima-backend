import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductVariantsTable1763000000005
  implements MigrationInterface
{
  name = 'CreateProductVariantsTable1763000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_variants" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "sku" character varying(50) NOT NULL, "variant_name" character varying(255) NOT NULL, "description" character varying(500), "selling_price" numeric(10,2) NOT NULL, "cost_price" numeric(10,2), "minimum_order" integer NOT NULL DEFAULT '1', "status" character varying NOT NULL DEFAULT 'Active', "media_id" integer, "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_product_variants_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_product_id" ON "product_variants" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_product_variants_sku" ON "product_variants" ("sku")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_media_id" ON "product_variants" ("media_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_product_variants_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_product_variants_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_product_variants_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_product_variants_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_product_variants_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_product_variants_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_product_variants_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_product_variants_product_id"`,
    );
    await queryRunner.query(`DROP INDEX "idx_product_variants_sku"`);
    await queryRunner.query(`DROP INDEX "idx_product_variants_media_id"`);
    await queryRunner.query(`DROP INDEX "idx_product_variants_product_id"`);
    await queryRunner.query(`DROP TABLE "product_variants"`);
  }
}
