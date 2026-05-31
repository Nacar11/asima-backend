import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `time_correction_requests` — employee requests to fix/add a time entry,
 * routed through the same 2-step approval chain as leave (plan §3.3).
 *
 * On approval the time-correction service calls
 * `TimeEntriesService.applyCorrection`, which writes the underlying
 * time_entries row with `source = 'correction'`. `target_entry_id` is
 * NULL for a missed-punch (no row to correct → a new one is created).
 *
 * Reuses the shared `decision_path` enum (created in the leave migration).
 */
export class CreateTimeCorrectionRequestsTable1778510000000 implements MigrationInterface {
  name = 'CreateTimeCorrectionRequestsTable1778510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "time_correction_status" AS ENUM ('pending_l1', 'pending_l2', 'approved', 'rejected', 'cancelled')`,
    );

    await queryRunner.query(`
      CREATE TABLE "time_correction_requests" (
        "id" SERIAL NOT NULL,
        "employee_id" integer NOT NULL,
        "target_entry_id" integer,
        "work_date" date NOT NULL,
        "proposed_time_in" TIMESTAMP WITH TIME ZONE NOT NULL,
        "proposed_time_out" TIMESTAMP WITH TIME ZONE,
        "reason" character varying(500) NOT NULL,
        "status" "time_correction_status" NOT NULL DEFAULT 'pending_l1',
        "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "decided_at" TIMESTAMP WITH TIME ZONE,
        "decided_by" integer,
        "decision_note" character varying(500),
        "decision_path" "decision_path",
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        "cancelled_by" integer,
        "l1_approver_id" integer NOT NULL,
        "l2_approver_id" integer,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_time_correction_requests" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_time_correction_requests_window"
          CHECK ("proposed_time_out" IS NULL OR "proposed_time_out" > "proposed_time_in")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_tcr_employee_status" ON "time_correction_requests" ("employee_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tcr_employee_work_date" ON "time_correction_requests" ("employee_id", "work_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tcr_status_submitted" ON "time_correction_requests" ("status", "submitted_at")`,
    );
    await queryRunner.query(`
      CREATE INDEX "IDX_tcr_l1_inbox"
      ON "time_correction_requests" ("l1_approver_id")
      WHERE "status" = 'pending_l1' AND "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tcr_l2_inbox"
      ON "time_correction_requests" ("l2_approver_id")
      WHERE "status" = 'pending_l2' AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "time_correction_requests"
      ADD CONSTRAINT "FK_tcr_target_entry_id"
      FOREIGN KEY ("target_entry_id") REFERENCES "time_entries"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    for (const [name, column] of [
      ['FK_tcr_employee_id', 'employee_id'],
      ['FK_tcr_decided_by', 'decided_by'],
      ['FK_tcr_cancelled_by', 'cancelled_by'],
      ['FK_tcr_l1_approver_id', 'l1_approver_id'],
      ['FK_tcr_l2_approver_id', 'l2_approver_id'],
    ]) {
      await queryRunner.query(`
        ALTER TABLE "time_correction_requests"
        ADD CONSTRAINT "${name}"
        FOREIGN KEY ("${column}") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of [
      'FK_tcr_l2_approver_id',
      'FK_tcr_l1_approver_id',
      'FK_tcr_cancelled_by',
      'FK_tcr_decided_by',
      'FK_tcr_employee_id',
      'FK_tcr_target_entry_id',
    ]) {
      await queryRunner.query(`ALTER TABLE "time_correction_requests" DROP CONSTRAINT "${name}"`);
    }
    await queryRunner.query(`DROP INDEX "public"."IDX_tcr_l2_inbox"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tcr_l1_inbox"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tcr_status_submitted"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tcr_employee_work_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tcr_employee_status"`);
    await queryRunner.query(`DROP TABLE "time_correction_requests"`);
    await queryRunner.query(`DROP TYPE "time_correction_status"`);
  }
}
