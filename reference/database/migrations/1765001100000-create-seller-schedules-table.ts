import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSellerSchedulesTable1765001100000
  implements MigrationInterface
{
  name = 'CreateSellerSchedulesTable1765001100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "seller_schedules" (
        "id" SERIAL NOT NULL,
        "seller_id" integer NOT NULL,
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
        CONSTRAINT "PK_seller_schedules_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_seller_schedules_seller_day" UNIQUE ("seller_id", "day_of_week"),
        CONSTRAINT "FK_seller_schedules_seller" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_seller_schedules_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_seller_schedules_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_seller_schedules_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_seller_schedules_seller_id" ON "seller_schedules" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_schedules_day_of_week" ON "seller_schedules" ("day_of_week")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_schedules_is_available" ON "seller_schedules" ("is_available")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_seller_schedules_is_available"`);
    await queryRunner.query(`DROP INDEX "IDX_seller_schedules_day_of_week"`);
    await queryRunner.query(`DROP INDEX "IDX_seller_schedules_seller_id"`);
    await queryRunner.query(`DROP TABLE "seller_schedules"`);
  }
}
