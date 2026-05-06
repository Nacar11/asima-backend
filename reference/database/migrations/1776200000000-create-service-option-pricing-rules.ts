import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceOptionPricingRules1776200000000
  implements MigrationInterface
{
  name = 'CreateServiceOptionPricingRules1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_option_pricing_rules" (
        "id" SERIAL NOT NULL,
        "service_id" integer NOT NULL,
        "name" character varying(255) NOT NULL,
        "code" character varying(120) NOT NULL,
        "description" text,
        "price_adjustment" numeric(12,2) NOT NULL DEFAULT 0,
        "duration_adjustment_minutes" integer NOT NULL DEFAULT 0,
        "priority" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_service_option_pricing_rules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_option_pricing_rules_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_option_pricing_rules_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_option_pricing_rules_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_service_option_pricing_rules_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_pricing_rules_service_id" ON "service_option_pricing_rules" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_pricing_rules_is_active" ON "service_option_pricing_rules" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_pricing_rules_deleted_at" ON "service_option_pricing_rules" ("deleted_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_service_option_pricing_rules_service_code" ON "service_option_pricing_rules" ("service_id", "code") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "service_option_pricing_rule_conditions" (
        "id" SERIAL NOT NULL,
        "rule_id" integer NOT NULL,
        "option_group_id" integer NOT NULL,
        "option_value_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_option_pricing_rule_conditions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_option_pricing_rule_conditions_rule" FOREIGN KEY ("rule_id") REFERENCES "service_option_pricing_rules"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_option_pricing_rule_conditions_group" FOREIGN KEY ("option_group_id") REFERENCES "service_option_groups"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_option_pricing_rule_conditions_value" FOREIGN KEY ("option_value_id") REFERENCES "service_option_values"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_pricing_rule_conditions_rule_id" ON "service_option_pricing_rule_conditions" ("rule_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_option_pricing_rule_conditions_group_value" ON "service_option_pricing_rule_conditions" ("option_group_id", "option_value_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_service_option_pricing_rule_conditions_rule_group" ON "service_option_pricing_rule_conditions" ("rule_id", "option_group_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_service_option_pricing_rule_conditions_rule_group"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_service_option_pricing_rule_conditions_group_value"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_service_option_pricing_rule_conditions_rule_id"`,
    );
    await queryRunner.query(
      `DROP TABLE "service_option_pricing_rule_conditions"`,
    );

    await queryRunner.query(
      `DROP INDEX "UQ_service_option_pricing_rules_service_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_service_option_pricing_rules_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_service_option_pricing_rules_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_service_option_pricing_rules_service_id"`,
    );
    await queryRunner.query(`DROP TABLE "service_option_pricing_rules"`);
  }
}
