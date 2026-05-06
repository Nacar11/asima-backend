import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceCategories1765000500000
  implements MigrationInterface
{
  name = 'CreateServiceCategories1765000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_categories" (
        "id" SERIAL PRIMARY KEY,
        "parent_id" integer,
        "name" varchar(100) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "description" text,
        "icon_url" varchar(500),
        "image_url" varchar(500),
        "level" integer NOT NULL DEFAULT 0,
        "display_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_featured" boolean NOT NULL DEFAULT false,
        "default_platform_fee_percent" numeric(5,2) NOT NULL DEFAULT 10,
        "meta_title" varchar(255),
        "meta_description" varchar(500),
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_service_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_service_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "service_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_categories_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_categories_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_categories_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_service_categories_parent" ON "service_categories" ("parent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_categories_active" ON "service_categories" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_categories_featured" ON "service_categories" ("is_featured")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_service_categories_featured"`);
    await queryRunner.query(`DROP INDEX "IDX_service_categories_active"`);
    await queryRunner.query(`DROP INDEX "IDX_service_categories_parent"`);
    await queryRunner.query(`DROP TABLE "service_categories"`);
  }
}
