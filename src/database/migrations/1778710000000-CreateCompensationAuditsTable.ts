import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompensationAuditsTable1778710000000 implements MigrationInterface {
  name = 'CreateCompensationAuditsTable1778710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "compensation_audits" (
        "id" SERIAL NOT NULL,
        "compensation_id" integer NOT NULL,
        "employee_id" integer NOT NULL,
        "action" character varying(16) NOT NULL,
        "before_monthly_salary" numeric(12,2),
        "after_monthly_salary" numeric(12,2),
        "before_hourly_rate" numeric(12,4),
        "after_hourly_rate" numeric(12,4),
        "before_effective_from" date,
        "after_effective_from" date,
        "actor_id" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_compensation_audits" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_compensation_audits_action"
          CHECK ("action" IN ('created', 'updated', 'deleted'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_compensation_audits_compensation_id" ON "compensation_audits" ("compensation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_compensation_audits_employee_id" ON "compensation_audits" ("employee_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "compensation_audits"
      ADD CONSTRAINT "FK_compensation_audits_compensation_id"
      FOREIGN KEY ("compensation_id") REFERENCES "employee_compensations"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "compensation_audits" DROP CONSTRAINT "FK_compensation_audits_compensation_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_compensation_audits_employee_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_compensation_audits_compensation_id"`);
    await queryRunner.query(`DROP TABLE "compensation_audits"`);
  }
}
