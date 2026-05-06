import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1762919000000 implements MigrationInterface {
  name = 'CreateProductsTable1762919000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "product_name" character varying(255) NOT NULL, "description" text, "status" character varying(20) NOT NULL DEFAULT 'Draft', "seller_id" integer NOT NULL, "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_products_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_product_name" ON "products" ("product_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_deleted_at" ON "products" ("deleted_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_seller_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_products_deleted_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_product_name"`);
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
