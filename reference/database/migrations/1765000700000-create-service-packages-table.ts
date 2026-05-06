import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServicePackagesTable1765000700000
  implements MigrationInterface
{
  name = 'CreateServicePackagesTable1765000700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."service_packages_status_enum" AS ENUM('Active', 'Inactive', 'Archived')
    `);

    await queryRunner.query(`
      CREATE TABLE "service_packages" (
        "id" SERIAL NOT NULL,
        "service_id" integer NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "price" numeric(12,2) NOT NULL,
        "compare_at_price" numeric(12,2),
        "duration_minutes" integer,
        "inclusions" jsonb,
        "max_bookings_per_day" integer,
        "is_popular" boolean NOT NULL DEFAULT false,
        "display_order" integer NOT NULL DEFAULT 0,
        "status" "public"."service_packages_status_enum" NOT NULL DEFAULT 'Active',
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_service_packages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_packages_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_packages_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_packages_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_packages_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_service_packages_service_id" ON "service_packages" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_packages_status" ON "service_packages" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_service_packages_status"`);
    await queryRunner.query(`DROP INDEX "IDX_service_packages_service_id"`);
    await queryRunner.query(`DROP TABLE "service_packages"`);
    await queryRunner.query(
      `DROP TYPE "public"."service_packages_status_enum"`,
    );
  }
}
