import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCarouselBannersTable1765500000000
  implements MigrationInterface
{
  name = 'CreateCarouselBannersTable1765500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "carousel_banners" (
        "id" SERIAL NOT NULL,
        "media_id" integer NOT NULL,
        "headline" character varying(255) NOT NULL,
        "subtext" character varying(255),
        "cta_text" character varying(50) NOT NULL,
        "cta_link" character varying(500) NOT NULL,
        "display_order" integer NOT NULL DEFAULT '0',
        "is_active" boolean NOT NULL DEFAULT true,
        "start_at" TIMESTAMP,
        "end_at" TIMESTAMP,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_carousel_banners_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_carousel_banners_media_id" ON "carousel_banners" ("media_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_carousel_banners_is_active" ON "carousel_banners" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_carousel_banners_start_at" ON "carousel_banners" ("start_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_carousel_banners_end_at" ON "carousel_banners" ("end_at")`,
    );

    await queryRunner.query(
      `ALTER TABLE "carousel_banners" ADD CONSTRAINT "UQ_carousel_banners_display_order" UNIQUE ("display_order")`,
    );

    await queryRunner.query(
      `ALTER TABLE "carousel_banners" ADD CONSTRAINT "FK_carousel_banners_media_id" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carousel_banners" ADD CONSTRAINT "FK_carousel_banners_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carousel_banners" ADD CONSTRAINT "FK_carousel_banners_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carousel_banners" ADD CONSTRAINT "FK_carousel_banners_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carousel_banners" DROP CONSTRAINT "FK_carousel_banners_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carousel_banners" DROP CONSTRAINT "FK_carousel_banners_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carousel_banners" DROP CONSTRAINT "FK_carousel_banners_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carousel_banners" DROP CONSTRAINT "FK_carousel_banners_media_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "carousel_banners" DROP CONSTRAINT "UQ_carousel_banners_display_order"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_carousel_banners_end_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_carousel_banners_start_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_carousel_banners_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_carousel_banners_media_id"`,
    );

    await queryRunner.query(`DROP TABLE "carousel_banners"`);
  }
}
