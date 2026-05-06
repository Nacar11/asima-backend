import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceMilestoneTemplatesTable1765001000000
  implements MigrationInterface
{
  name = 'CreateServiceMilestoneTemplatesTable1765001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_milestone_templates" (
        "id" SERIAL NOT NULL,
        "service_id" integer NOT NULL,
        "package_id" integer,
        "name" character varying(255) NOT NULL,
        "description" text,
        "sequence_order" integer NOT NULL,
        "estimated_duration_hours" numeric(5,2),
        "estimated_duration_days" integer,
        "payment_percent" numeric(5,2) NOT NULL,
        "deliverables" jsonb,
        "requires_customer_approval" boolean NOT NULL DEFAULT true,
        "auto_approve_after_hours" integer NOT NULL DEFAULT 48,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_service_milestone_templates_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_smt_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_smt_package" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_smt_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_smt_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_smt_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_smt_service_id" ON "service_milestone_templates" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_smt_package_id" ON "service_milestone_templates" ("package_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_smt_service_sequence" ON "service_milestone_templates" ("service_id", "sequence_order")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_smt_service_sequence"`);
    await queryRunner.query(`DROP INDEX "IDX_smt_package_id"`);
    await queryRunner.query(`DROP INDEX "IDX_smt_service_id"`);
    await queryRunner.query(`DROP TABLE "service_milestone_templates"`);
  }
}
