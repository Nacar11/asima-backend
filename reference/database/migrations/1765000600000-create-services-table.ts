import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServicesTable1765000600000 implements MigrationInterface {
  name = 'CreateServicesTable1765000600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."services_pricing_type_enum" AS ENUM('fixed', 'hourly', 'quote')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."services_status_enum" AS ENUM('Draft', 'Active', 'Paused', 'Archived', 'Inactive')
    `);

    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" SERIAL NOT NULL,
        "seller_id" integer NOT NULL,
        "category_id" integer,
        "currency_id" integer,
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "short_description" character varying(500),
        "pricing_type" "public"."services_pricing_type_enum" NOT NULL DEFAULT 'fixed',
        "base_price" numeric(12,2),
        "hourly_rate" numeric(10,2),
        "estimated_duration_minutes" integer,
        "minimum_duration_minutes" integer,
        "maximum_duration_minutes" integer,
        "service_radius_km" integer DEFAULT 10,
        "is_remote_available" boolean NOT NULL DEFAULT false,
        "max_bookings_per_day" integer,
        "advance_booking_days" integer DEFAULT 30,
        "minimum_notice_hours" integer DEFAULT 24,
        "status" "public"."services_status_enum" NOT NULL DEFAULT 'Draft',
        "is_featured" boolean NOT NULL DEFAULT false,
        "requires_quote" boolean NOT NULL DEFAULT false,
        "instant_booking" boolean NOT NULL DEFAULT true,
        "view_count" integer NOT NULL DEFAULT 0,
        "total_bookings" integer NOT NULL DEFAULT 0,
        "average_rating" numeric(2,1) NOT NULL DEFAULT 0,
        "total_reviews" integer NOT NULL DEFAULT 0,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_services_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_services_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_services_seller" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_services_category" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_services_currency" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_services_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_services_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_services_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_services_seller" ON "services" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_services_category" ON "services" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_services_status" ON "services" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_services_status"`);
    await queryRunner.query(`DROP INDEX "IDX_services_category"`);
    await queryRunner.query(`DROP INDEX "IDX_services_seller"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TYPE "public"."services_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."services_pricing_type_enum"`);
  }
}
