import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `approval_chains` — per-employee, versioned approver assignments.
 *
 * See ADR 0001 and the 2026-05-30 plan §3.1. One row = "for THIS
 * employee, at THIS step, THIS approver can act, effective from
 * `effective_at` until `ended_at` (NULL = currently active)".
 *
 * Reassignment is modeled as logical-end + insert (mirrors
 * work_schedules): stamp `ended_at = now()` on the active row, then
 * insert a new row. Historical leave/correction requests snapshot the
 * approver at submit time, so the old row staying in the table lets a
 * past request still resolve to the approver who was active then.
 *
 * No soft-delete columns on this table — reassignment IS the
 * "deletion" mechanism (logical end). The partial unique index is the
 * concurrent-write safety net behind the service-layer 422 pre-check.
 */
export class CreateApprovalChainsTable1778300000000 implements MigrationInterface {
  name = 'CreateApprovalChainsTable1778300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "approval_chains" (
        "id" SERIAL NOT NULL,
        "employee_id" integer NOT NULL,
        "step" integer NOT NULL,
        "approver_id" integer NOT NULL,
        "effective_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "ended_at" TIMESTAMP WITH TIME ZONE,
        "created_by" integer,
        "updated_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_approval_chains" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_approval_chains_step_positive"
          CHECK ("step" >= 1),
        CONSTRAINT "CHK_approval_chains_no_self_approval"
          CHECK ("approver_id" <> "employee_id"),
        CONSTRAINT "UQ_approval_chains_employee_step_effective"
          UNIQUE ("employee_id", "step", "effective_at")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_approval_chains_employee_ended" ON "approval_chains" ("employee_id", "ended_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_approval_chains_approver" ON "approval_chains" ("approver_id")`,
    );

    /*
     * At most one ACTIVE approver per (employee, step). Reassignment
     * ends the old row (ended_at = now()) before inserting the new one;
     * this index is the source of truth for the concurrent-write race.
     */
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_approval_chains_active_step_uq"
      ON "approval_chains" ("employee_id", "step")
      WHERE "ended_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "approval_chains"
      ADD CONSTRAINT "FK_approval_chains_employee_id"
      FOREIGN KEY ("employee_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "approval_chains"
      ADD CONSTRAINT "FK_approval_chains_approver_id"
      FOREIGN KEY ("approver_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "approval_chains" DROP CONSTRAINT "FK_approval_chains_approver_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "approval_chains" DROP CONSTRAINT "FK_approval_chains_employee_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_approval_chains_active_step_uq"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_approval_chains_approver"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_approval_chains_employee_ended"`);
    await queryRunner.query(`DROP TABLE "approval_chains"`);
  }
}
