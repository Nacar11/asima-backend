import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTagsTable1763000000000 implements MigrationInterface {
  name = 'CreateTagsTable1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tags" (
        "id" BIGSERIAL NOT NULL,
        "seller_id" bigint,
        "name" character varying(100) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "description" text,
        "count" bigint NOT NULL DEFAULT 0,
        "display_order" integer NOT NULL DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'Active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" bigint,
        "updated_by" bigint,
        "deleted_by" bigint,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tags_seller_id_name" UNIQUE ("seller_id", "name"),
        CONSTRAINT "UQ_tags_seller_id_slug" UNIQUE ("seller_id", "slug")
      )`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_tags_seller_id" ON "tags" ("seller_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_tags_name" ON "tags" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_tags_slug" ON "tags" ("slug")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_tags_count" ON "tags" ("count")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tags_display_order" ON "tags" ("display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tags_created_by" ON "tags" ("created_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tags_deleted_at" ON "tags" ("deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tags_status" ON "tags" ("status")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_tags_seller_id" FOREIGN KEY ("seller_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_tags_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_tags_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_tags_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_tags_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_tags_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_tags_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_tags_seller_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_deleted_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_created_by"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_display_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_count"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_seller_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
