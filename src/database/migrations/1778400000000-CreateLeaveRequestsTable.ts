import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `leave_requests` — employee leave with a 2-step approval chain snapshot.
 *
 * See the 2026-05-30 plan §3.2 and ADR 0001. `l1_approver_id` /
 * `l2_approver_id` are snapshotted from the active approval_chain at
 * submit time so a historical request still resolves to the approver who
 * was active then, even after the chain is reassigned. `l1` is NOT NULL
 * (Q1 hard-block: no chain → no submission); `l2` is nullable
 * (single-step chain auto-approves after L1).
 */
export class CreateLeaveRequestsTable1778400000000 implements MigrationInterface {
  name = 'CreateLeaveRequestsTable1778400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "leave_type" AS ENUM ('annual', 'sick', 'bereavement', 'unpaid', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "leave_request_status" AS ENUM ('pending_l1', 'pending_l2', 'approved', 'rejected', 'cancelled')`,
    );
    await queryRunner.query(`CREATE TYPE "decision_path" AS ENUM ('chain', 'override')`);

    await queryRunner.query(`
      CREATE TABLE "leave_requests" (
        "id" SERIAL NOT NULL,
        "employee_id" integer NOT NULL,
        "leave_type" "leave_type" NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "reason" character varying(500),
        "status" "leave_request_status" NOT NULL DEFAULT 'pending_l1',
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
        CONSTRAINT "PK_leave_requests" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_leave_requests_date_range"
          CHECK ("end_date" >= "start_date")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_leave_requests_employee_status" ON "leave_requests" ("employee_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leave_requests_status_submitted" ON "leave_requests" ("status", "submitted_at")`,
    );
    // Inbox queries — only the rows an approver can currently act on.
    await queryRunner.query(`
      CREATE INDEX "IDX_leave_requests_l1_inbox"
      ON "leave_requests" ("l1_approver_id")
      WHERE "status" = 'pending_l1' AND "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_leave_requests_l2_inbox"
      ON "leave_requests" ("l2_approver_id")
      WHERE "status" = 'pending_l2' AND "deleted_at" IS NULL
    `);

    for (const [name, column] of [
      ['FK_leave_requests_employee_id', 'employee_id'],
      ['FK_leave_requests_decided_by', 'decided_by'],
      ['FK_leave_requests_cancelled_by', 'cancelled_by'],
      ['FK_leave_requests_l1_approver_id', 'l1_approver_id'],
      ['FK_leave_requests_l2_approver_id', 'l2_approver_id'],
    ]) {
      await queryRunner.query(`
        ALTER TABLE "leave_requests"
        ADD CONSTRAINT "${name}"
        FOREIGN KEY ("${column}") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of [
      'FK_leave_requests_l2_approver_id',
      'FK_leave_requests_l1_approver_id',
      'FK_leave_requests_cancelled_by',
      'FK_leave_requests_decided_by',
      'FK_leave_requests_employee_id',
    ]) {
      await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT "${name}"`);
    }
    await queryRunner.query(`DROP INDEX "public"."IDX_leave_requests_l2_inbox"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leave_requests_l1_inbox"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leave_requests_status_submitted"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leave_requests_employee_status"`);
    await queryRunner.query(`DROP TABLE "leave_requests"`);
    await queryRunner.query(`DROP TYPE "decision_path"`);
    await queryRunner.query(`DROP TYPE "leave_request_status"`);
    await queryRunner.query(`DROP TYPE "leave_type"`);
  }
}
