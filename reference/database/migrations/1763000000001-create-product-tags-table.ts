import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTagsTable1763000000001 implements MigrationInterface {
  name = 'CreateProductTagsTable1763000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_tags" (
        "id" BIGSERIAL NOT NULL,
        "product_id" bigint NOT NULL,
        "tag_id" bigint NOT NULL,
        "tag_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" bigint,
        CONSTRAINT "PK_product_tags_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_tags_product_tag" UNIQUE ("product_id", "tag_id")
      )`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_product_tags_product_id" ON "product_tags" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_tags_tag_id" ON "product_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_tags_created_at" ON "product_tags" ("created_at")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "product_tags" ADD CONSTRAINT "FK_product_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" ADD CONSTRAINT "FK_product_tags_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Note: product_id foreign key will be added when products table is created
    // For now, we'll add a comment
    await queryRunner.query(
      `COMMENT ON COLUMN "product_tags"."product_id" IS 'Foreign key to products table (to be added when products module is implemented)'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "product_tags" DROP CONSTRAINT "FK_product_tags_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" DROP CONSTRAINT "FK_product_tags_tag_id"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_tags_created_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_product_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_tags_product_id"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "product_tags"`);
  }
}
