import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceOptionValuesTable1768000200000
  implements MigrationInterface
{
  name = 'CreateServiceOptionValuesTable1768000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_option_values" (
        "id" SERIAL NOT NULL,
        "option_group_id" integer NOT NULL,
        "label" character varying(255) NOT NULL,
        "value" character varying(100) NOT NULL,
        "description" text,
        "price_adjustment" numeric(12,2) NOT NULL DEFAULT 0,
        "price_multiplier" numeric(5,4) NOT NULL DEFAULT 1.0,
        "duration_adjustment_minutes" integer NOT NULL DEFAULT 0,
        "icon_url" character varying(500),
        "display_order" integer NOT NULL DEFAULT 0,
        "is_default" boolean NOT NULL DEFAULT false,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_option_values_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_option_values_option_group" FOREIGN KEY ("option_group_id") REFERENCES "service_option_groups"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_values_option_group_id" ON "service_option_values" ("option_group_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_values_status" ON "service_option_values" ("status")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_service_option_values_group_value" ON "service_option_values" ("option_group_id", "value")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_service_option_values_group_value"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_service_option_values_status"`);
    await queryRunner.query(
      `DROP INDEX "IDX_service_option_values_option_group_id"`,
    );
    await queryRunner.query(`DROP TABLE "service_option_values"`);
  }
}
