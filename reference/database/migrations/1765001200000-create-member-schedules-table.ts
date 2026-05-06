import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMemberSchedulesTable1765001200000
  implements MigrationInterface
{
  name = 'CreateMemberSchedulesTable1765001200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "member_schedules" (
        "id" SERIAL NOT NULL,
        "seller_member_id" integer NOT NULL,
        "day_of_week" integer NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        "start_time" TIME,
        "end_time" TIME,
        "break_start" TIME,
        "break_end" TIME,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_member_schedules_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_member_schedules_member_day" UNIQUE ("seller_member_id", "day_of_week"),
        CONSTRAINT "FK_member_schedules_member" FOREIGN KEY ("seller_member_id") REFERENCES "seller_members"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_member_schedules_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_member_schedules_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_member_schedules_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_member_schedules_member_id" ON "member_schedules" ("seller_member_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_member_schedules_day_of_week" ON "member_schedules" ("day_of_week")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_member_schedules_is_available" ON "member_schedules" ("is_available")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_member_schedules_is_available"`);
    await queryRunner.query(`DROP INDEX "IDX_member_schedules_day_of_week"`);
    await queryRunner.query(`DROP INDEX "IDX_member_schedules_member_id"`);
    await queryRunner.query(`DROP TABLE "member_schedules"`);
  }
}
