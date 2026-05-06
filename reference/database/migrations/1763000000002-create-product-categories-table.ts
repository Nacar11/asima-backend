import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductCategoriesTable1763000000002
  implements MigrationInterface
{
  name = 'CreateProductCategoriesTable1763000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_categories" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "category_id" integer NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "display_order" integer NOT NULL DEFAULT '0', "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_product_categories_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_product_id" ON "product_categories" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_category_id" ON "product_categories" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_product_categories_product_category_unique" ON "product_categories" ("product_id", "category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_is_primary" ON "product_categories" ("is_primary")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_display_order" ON "product_categories" ("display_order")`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_product_categories_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_product_categories_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_product_categories_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_product_categories_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_product_categories_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_product_categories_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_product_categories_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_product_categories_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_product_categories_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_product_categories_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "idx_product_categories_display_order"`,
    );
    await queryRunner.query(`DROP INDEX "idx_product_categories_is_primary"`);
    await queryRunner.query(
      `DROP INDEX "idx_product_categories_product_category_unique"`,
    );
    await queryRunner.query(`DROP INDEX "idx_product_categories_category_id"`);
    await queryRunner.query(`DROP INDEX "idx_product_categories_product_id"`);
    await queryRunner.query(`DROP TABLE "product_categories"`);
  }
}
