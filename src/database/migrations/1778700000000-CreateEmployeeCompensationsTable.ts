import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeeCompensationsTable1778700000000 implements MigrationInterface {
  name = 'CreateEmployeeCompensationsTable1778700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "employee_compensations" (
        "id" SERIAL NOT NULL,
        "employee_id" integer NOT NULL,
        "monthly_salary" numeric(12,2) NOT NULL,
        "hourly_rate" numeric(12,4) NOT NULL,
        "hourly_rate_is_overridden" boolean NOT NULL DEFAULT false,
        "effective_from" date NOT NULL,
        "effective_to" date,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_employee_compensations" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_employee_compensations_monthly_salary_nonneg"
          CHECK ("monthly_salary" >= 0),
        CONSTRAINT "CHK_employee_compensations_hourly_rate_nonneg"
          CHECK ("hourly_rate" >= 0),
        CONSTRAINT "CHK_employee_compensations_effective_range"
          CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_employee_compensations_employee_effective_to" ON "employee_compensations" ("employee_id", "effective_to")`,
    );

    /*
     * At most one ACTIVE row per employee. A pay change end-dates the
     * existing active row (effective_to = <new effective_from> - 1 day)
     * and inserts a new active row, inside one transaction (see
     * CompensationService.create). This index is the source of truth for
     * the invariant — the service-layer guard surfaces a clearer 409, but
     * the DB protects against concurrent writes.
     */
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_employee_compensations_one_active_per_employee"
      ON "employee_compensations" ("employee_id")
      WHERE "effective_to" IS NULL AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_compensations"
      ADD CONSTRAINT "FK_employee_compensations_employee_id"
      FOREIGN KEY ("employee_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_compensations" DROP CONSTRAINT "FK_employee_compensations_employee_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_employee_compensations_one_active_per_employee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_employee_compensations_employee_effective_to"`,
    );
    await queryRunner.query(`DROP TABLE "employee_compensations"`);
  }
}
