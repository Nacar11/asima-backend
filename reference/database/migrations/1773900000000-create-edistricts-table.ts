import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEdistrictsTable1773900000000 implements MigrationInterface {
  name = 'CreateEdistrictsTable1773900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "edistricts" (
        "id" SERIAL NOT NULL,
        "key" character varying(100) NOT NULL,
        "name" character varying(120) NOT NULL,
        "subtitle" character varying(120),
        "store_name" character varying(255),
        "seller_id" integer,
        "image_url" character varying(500),
        "status" character varying(32) NOT NULL DEFAULT 'active',
        "display_order" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_edistricts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_edistricts_key" UNIQUE ("key"),
        CONSTRAINT "FK_edistricts_seller" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_edistricts_status" ON "edistricts" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_edistricts_display_order" ON "edistricts" ("display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_edistricts_seller_id" ON "edistricts" ("seller_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "edistricts"`);
  }
}
