import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkSchedulesTable1778200100000 implements MigrationInterface {
  name = 'CreateWorkSchedulesTable1778200100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_schedules" (
        "id" SERIAL NOT NULL,
        "employee_id" integer NOT NULL,
        "day_of_week" smallint NOT NULL,
        "expected_in" time NOT NULL,
        "expected_out" time NOT NULL,
        "break_minutes" integer NOT NULL DEFAULT 0,
        "break_start" time,
        "effective_from" date NOT NULL,
        "effective_to" date,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_work_schedules" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_work_schedules_day_of_week"
          CHECK ("day_of_week" BETWEEN 0 AND 6),
        CONSTRAINT "CHK_work_schedules_break_minutes_nonneg"
          CHECK ("break_minutes" >= 0),
        CONSTRAINT "CHK_work_schedules_break_start_required"
          CHECK ("break_minutes" = 0 OR "break_start" IS NOT NULL),
        CONSTRAINT "CHK_work_schedules_break_start_in_window"
          CHECK ("break_start" IS NULL OR "break_start" >= "expected_in"),
        CONSTRAINT "CHK_work_schedules_break_fits"
          CHECK (
            "break_start" IS NULL
            OR "break_start" + ("break_minutes" || ' minutes')::interval <= "expected_out"
          ),
        CONSTRAINT "CHK_work_schedules_window"
          CHECK ("expected_out" > "expected_in"),
        CONSTRAINT "CHK_work_schedules_effective_range"
          CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_work_schedules_employee_day" ON "work_schedules" ("employee_id", "day_of_week")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_schedules_employee_effective_to" ON "work_schedules" ("employee_id", "effective_to")`,
    );

    /*
     * At most one ACTIVE row per (employee, day_of_week). New schedules
     * are added by first stamping effective_to on the existing row (the
     * "logical end" — see service.endLogically), then inserting a new
     * row with effective_from = <next start>. This index is the source
     * of truth for the invariant — the service-layer guard surfaces a
     * clearer 409, but the DB protects against concurrent writes.
     */
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_work_schedules_one_active_per_employee_day"
      ON "work_schedules" ("employee_id", "day_of_week")
      WHERE "effective_to" IS NULL AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "work_schedules"
      ADD CONSTRAINT "FK_work_schedules_employee_id"
      FOREIGN KEY ("employee_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "work_schedules" DROP CONSTRAINT "FK_work_schedules_employee_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_work_schedules_one_active_per_employee_day"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_work_schedules_employee_effective_to"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_work_schedules_employee_day"`);
    await queryRunner.query(`DROP TABLE "work_schedules"`);
  }
}
