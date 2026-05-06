import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceGalleryTable1765000900000
  implements MigrationInterface
{
  name = 'CreateServiceGalleryTable1765000900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_gallery" (
        "id" SERIAL NOT NULL,
        "service_id" integer NOT NULL,
        "image_url" character varying(500) NOT NULL,
        "caption" character varying(255),
        "alt_text" character varying(255),
        "is_primary" boolean NOT NULL DEFAULT false,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_service_gallery_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_gallery_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_gallery_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_gallery_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_gallery_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_service_gallery_service_id" ON "service_gallery" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_gallery_is_primary" ON "service_gallery" ("is_primary")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_service_gallery_is_primary"`);
    await queryRunner.query(`DROP INDEX "IDX_service_gallery_service_id"`);
    await queryRunner.query(`DROP TABLE "service_gallery"`);
  }
}
