import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceAddonsTables1768000000000
  implements MigrationInterface
{
  name = 'CreateServiceAddonsTables1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create service_addons table
    await queryRunner.query(`
      CREATE TABLE "service_addons" (
        "id" SERIAL NOT NULL,
        "service_id" integer NOT NULL,
        "name" character varying(255) NOT NULL,
        "code" character varying(100) NOT NULL,
        "description" text,
        "short_description" character varying(500),
        "unit_type" character varying(100),
        "price" numeric(12,2) NOT NULL,
        "compare_at_price" numeric(12,2),
        "duration_minutes" integer,
        "min_quantity" integer NOT NULL DEFAULT 0,
        "max_quantity" integer NOT NULL DEFAULT 10,
        "display_order" integer NOT NULL DEFAULT 0,
        "icon_url" character varying(500),
        "image_url" character varying(500),
        "is_popular" boolean NOT NULL DEFAULT false,
        "is_required" boolean NOT NULL DEFAULT false,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_service_addons_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_addons_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_addons_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_addons_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_addons_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for service_addons
    await queryRunner.query(
      `CREATE INDEX "IDX_service_addons_service_id" ON "service_addons" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_addons_status" ON "service_addons" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_addons_deleted_at" ON "service_addons" ("deleted_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_service_addons_service_code" ON "service_addons" ("service_id", "code") WHERE "deleted_at" IS NULL`,
    );

    // Create service_addon_inclusions table
    await queryRunner.query(`
      CREATE TABLE "service_addon_inclusions" (
        "id" SERIAL NOT NULL,
        "addon_id" integer NOT NULL,
        "description" text NOT NULL,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_addon_inclusions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_addon_inclusions_addon" FOREIGN KEY ("addon_id") REFERENCES "service_addons"("id") ON DELETE CASCADE
      )
    `);

    // Create index for service_addon_inclusions
    await queryRunner.query(
      `CREATE INDEX "IDX_service_addon_inclusions_addon_id" ON "service_addon_inclusions" ("addon_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_service_addon_inclusions_addon_id"`,
    );
    await queryRunner.query(`DROP TABLE "service_addon_inclusions"`);
    await queryRunner.query(`DROP INDEX "UQ_service_addons_service_code"`);
    await queryRunner.query(`DROP INDEX "IDX_service_addons_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_service_addons_status"`);
    await queryRunner.query(`DROP INDEX "IDX_service_addons_service_id"`);
    await queryRunner.query(`DROP TABLE "service_addons"`);
  }
}
