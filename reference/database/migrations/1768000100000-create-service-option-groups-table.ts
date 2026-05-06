import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceOptionGroupsTable1768000100000
  implements MigrationInterface
{
  name = 'CreateServiceOptionGroupsTable1768000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_option_groups" (
        "id" SERIAL NOT NULL,
        "service_id" integer NOT NULL,
        "name" character varying(255) NOT NULL,
        "code" character varying(100) NOT NULL,
        "description" text,
        "input_type" character varying(50) NOT NULL DEFAULT 'select',
        "min_value" integer DEFAULT 0,
        "max_value" integer DEFAULT 10,
        "default_value" integer DEFAULT 1,
        "display_order" integer NOT NULL DEFAULT 0,
        "is_required" boolean NOT NULL DEFAULT true,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_service_option_groups_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_option_groups_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_option_groups_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_option_groups_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_option_groups_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_groups_service_id" ON "service_option_groups" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_groups_status" ON "service_option_groups" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_groups_deleted_at" ON "service_option_groups" ("deleted_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_service_option_groups_service_code" ON "service_option_groups" ("service_id", "code") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_service_option_groups_service_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_service_option_groups_deleted_at"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_service_option_groups_status"`);
    await queryRunner.query(
      `DROP INDEX "IDX_service_option_groups_service_id"`,
    );
    await queryRunner.query(`DROP TABLE "service_option_groups"`);
  }
}
