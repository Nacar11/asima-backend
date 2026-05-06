import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewMediaMappingsTable1764600000004
  implements MigrationInterface
{
  name = 'CreateReviewMediaMappingsTable1764600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create review_media_mappings table
    await queryRunner.query(
      `CREATE TABLE "review_media_mappings" (
        "id" SERIAL NOT NULL,
        "review_id" integer NOT NULL,
        "media_id" integer NOT NULL,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_review_media_mappings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_media_mappings_unique" UNIQUE ("review_id", "media_id")
      )`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_review_media_mappings_review_id" ON "review_media_mappings" ("review_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_review_media_mappings_media_id" ON "review_media_mappings" ("media_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_review_media_mappings_display_order" ON "review_media_mappings" ("display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_review_media_mappings_review_display" ON "review_media_mappings" ("review_id", "display_order")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "review_media_mappings" ADD CONSTRAINT "FK_review_media_mappings_review_id" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_media_mappings" ADD CONSTRAINT "FK_review_media_mappings_media_id" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "review_media_mappings" DROP CONSTRAINT "FK_review_media_mappings_media_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_media_mappings" DROP CONSTRAINT "FK_review_media_mappings_review_id"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "IDX_review_media_mappings_review_display"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_review_media_mappings_display_order"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_review_media_mappings_media_id"`);
    await queryRunner.query(`DROP INDEX "IDX_review_media_mappings_review_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "review_media_mappings"`);
  }
}
