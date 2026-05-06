import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1762918000000 implements MigrationInterface {
  name = 'CreateCategoriesTable1762918000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "category_name" character varying(100) NOT NULL, "description" text, "slug" character varying(100) NOT NULL, "display_order" integer NOT NULL DEFAULT '0', "parent_category_id" integer, "seller_id" integer, "status" character varying(20) NOT NULL DEFAULT 'Active', "product_count" bigint NOT NULL DEFAULT 0, "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_category_name" ON "categories" ("category_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_seller_id" ON "categories" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_parent_category_id" ON "categories" ("parent_category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_display_order" ON "categories" ("display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_product_count" ON "categories" ("product_count")`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_parent_category_id" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_seller_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_created_by"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_categories_product_count"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_categories_display_order"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_categories_parent_category_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_categories_seller_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_categories_category_name"`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
