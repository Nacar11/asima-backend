import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `leave_allocations` — append-only grant ledger backing leave balances.
 *
 * `allowance(employee, type) = SUM(amount)` over non-deleted rows. Default
 * 10 vacation / 10 sick land as `source='default'` rows (seed + user create);
 * admin grants append `source='admin_grant'`. Grants only add — `CHECK
 * (amount > 0)` — so the derived `available` stays non-negative; revocation
 * (if ever needed) is a soft-delete of the specific row, never a negative
 * amount (plan D7). Reuses the `leave_type` enum created by the
 * leave_requests migration.
 */
export class CreateLeaveAllocationsTable1778600000000 implements MigrationInterface {
  name = 'CreateLeaveAllocationsTable1778600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "leave_allocation_source" AS ENUM ('default', 'admin_grant')`,
    );

    await queryRunner.query(`
      CREATE TABLE "leave_allocations" (
        "id" SERIAL NOT NULL,
        "employee_id" integer NOT NULL,
        "leave_type" "leave_type" NOT NULL,
        "amount" integer NOT NULL,
        "source" "leave_allocation_source" NOT NULL,
        "reason" character varying(500),
        "granted_by" integer,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_leave_allocations" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_leave_allocations_amount_positive"
          CHECK ("amount" > 0)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_leave_allocations_employee_type" ON "leave_allocations" ("employee_id", "leave_type")`,
    );

    for (const [name, column] of [
      ['FK_leave_allocations_employee_id', 'employee_id'],
      ['FK_leave_allocations_granted_by', 'granted_by'],
    ]) {
      await queryRunner.query(`
        ALTER TABLE "leave_allocations"
        ADD CONSTRAINT "${name}"
        FOREIGN KEY ("${column}") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leave_allocations" DROP CONSTRAINT "FK_leave_allocations_granted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_allocations" DROP CONSTRAINT "FK_leave_allocations_employee_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_leave_allocations_employee_type"`);
    await queryRunner.query(`DROP TABLE "leave_allocations"`);
    await queryRunner.query(`DROP TYPE "leave_allocation_source"`);
  }
}
