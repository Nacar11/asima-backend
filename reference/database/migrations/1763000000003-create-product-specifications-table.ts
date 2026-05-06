import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductSpecificationsTable1763000000003
  implements MigrationInterface
{
  name = 'CreateProductSpecificationsTable1763000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_specifications" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "specification_name" character varying(255) NOT NULL, "unit" character varying(50), "specification_value" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_product_specifications_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_product_specifications_product_id" ON "product_specifications" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_specifications_specification_name" ON "product_specifications" (
        "specification_name"
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_specifications" ADD CONSTRAINT "FK_product_specifications_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_specifications" ADD CONSTRAINT "FK_product_specifications_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_specifications" ADD CONSTRAINT "FK_product_specifications_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_specifications" ADD CONSTRAINT "FK_product_specifications_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_specifications" DROP CONSTRAINT "FK_product_specifications_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_specifications" DROP CONSTRAINT "FK_product_specifications_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_specifications" DROP CONSTRAINT "FK_product_specifications_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_specifications" DROP CONSTRAINT "FK_product_specifications_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "idx_product_specifications_specification_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "idx_product_specifications_product_id"`,
    );
    await queryRunner.query(`DROP TABLE "product_specifications"`);
  }
}
