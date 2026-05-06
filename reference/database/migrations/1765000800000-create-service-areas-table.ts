import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceAreasTable1765000800000
  implements MigrationInterface
{
  name = 'CreateServiceAreasTable1765000800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."service_areas_additional_fee_type_enum" AS ENUM('fixed', 'per_km')
    `);

    await queryRunner.query(`
      CREATE TABLE "service_areas" (
        "id" SERIAL NOT NULL,
        "service_id" integer NOT NULL,
        "city" character varying(100),
        "province" character varying(100),
        "postal_code" character varying(20),
        "barangay" character varying(100),
        "center_latitude" numeric(10,8),
        "center_longitude" numeric(11,8),
        "radius_km" integer,
        "additional_fee" numeric(10,2) NOT NULL DEFAULT '0',
        "additional_fee_type" "public"."service_areas_additional_fee_type_enum" NOT NULL DEFAULT 'fixed',
        "minimum_order_amount" numeric(10,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_service_areas_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_areas_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_areas_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_areas_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_areas_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_service_areas_service_id" ON "service_areas" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_areas_city_province" ON "service_areas" ("city", "province")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_areas_postal_code" ON "service_areas" ("postal_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_areas_is_active" ON "service_areas" ("is_active")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_service_areas_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_service_areas_postal_code"`);
    await queryRunner.query(`DROP INDEX "IDX_service_areas_city_province"`);
    await queryRunner.query(`DROP INDEX "IDX_service_areas_service_id"`);
    await queryRunner.query(`DROP TABLE "service_areas"`);
    await queryRunner.query(
      `DROP TYPE "public"."service_areas_additional_fee_type_enum"`,
    );
  }
}
