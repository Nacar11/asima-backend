import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimeEntriesTable1778100000000 implements MigrationInterface {
  name = 'CreateTimeEntriesTable1778100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "time_source" AS ENUM ('manual', 'biometric', 'admin')`);
    await queryRunner.query(
      `CREATE TYPE "time_entry_status" AS ENUM ('open', 'confirmed')`,
    );

    await queryRunner.query(`
      CREATE TABLE "time_entries" (
        "id" SERIAL NOT NULL,
        "employee_id" integer NOT NULL,
        "work_date" date NOT NULL,
        "time_in" TIMESTAMP WITH TIME ZONE NOT NULL,
        "time_out" TIMESTAMP WITH TIME ZONE,
        "source" "time_source" NOT NULL,
        "status" "time_entry_status" NOT NULL DEFAULT 'open',
        "notes" character varying(500),
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_time_entries" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_time_entries_time_out_after_in"
          CHECK ("time_out" IS NULL OR "time_out" > "time_in")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_time_entries_employee_work_date" ON "time_entries" ("employee_id", "work_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_time_entries_employee_status" ON "time_entries" ("employee_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_time_entries_work_date" ON "time_entries" ("work_date")`,
    );

    /*
     * Database-level guarantee that an employee has at most one open
     * entry at a time. The toggle-punch endpoint relies on this — service
     * logic alone has a race window between findOpenForEmployee and create.
     * Soft-deleted rows are excluded so a deleted-then-reopened entry
     * doesn't trip the constraint.
     */
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_time_entries_one_open_per_employee"
      ON "time_entries" ("employee_id")
      WHERE "status" = 'open' AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "time_entries"
      ADD CONSTRAINT "FK_time_entries_employee_id"
      FOREIGN KEY ("employee_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "time_entries" DROP CONSTRAINT "FK_time_entries_employee_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_one_open_per_employee"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_work_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_employee_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_employee_work_date"`);
    await queryRunner.query(`DROP TABLE "time_entries"`);
    await queryRunner.query(`DROP TYPE "time_entry_status"`);
    await queryRunner.query(`DROP TYPE "time_source"`);
  }
}
