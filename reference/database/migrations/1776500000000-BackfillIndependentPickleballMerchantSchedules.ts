import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillIndependentPickleballMerchantSchedules1776500000000
  implements MigrationInterface
{
  name = 'BackfillIndependentPickleballMerchantSchedules1776500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "seller_schedules" (
        "seller_id",
        "day_of_week",
        "status",
        "start_time",
        "end_time",
        "break_start",
        "break_end",
        "created_by",
        "created_at",
        "updated_by",
        "updated_at"
      )
      SELECT
        location."seller_id",
        day_of_week.day,
        'Active',
        '08:00:00'::time,
        '22:00:00'::time,
        NULL,
        NULL,
        seller."user_id",
        NOW(),
        seller."user_id",
        NOW()
      FROM "pickleball_locations" location
      INNER JOIN "sellers" seller
        ON seller."id" = location."seller_id"
      CROSS JOIN generate_series(0, 6) AS day_of_week(day)
      WHERE location."deleted_at" IS NULL
        AND location."source_type" = 'independent_merchant'
        AND seller."deleted_at" IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "seller_schedules" existing_schedule
          WHERE existing_schedule."seller_id" = location."seller_id"
            AND existing_schedule."day_of_week" = day_of_week.day
        )
      ON CONFLICT ("seller_id", "day_of_week") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "seller_schedules" schedule
      USING "pickleball_locations" location, "sellers" seller
      WHERE schedule."seller_id" = location."seller_id"
        AND seller."id" = location."seller_id"
        AND location."source_type" = 'independent_merchant'
        AND schedule."status" = 'Active'
        AND schedule."start_time" = '08:00:00'::time
        AND schedule."end_time" = '22:00:00'::time
        AND schedule."break_start" IS NULL
        AND schedule."break_end" IS NULL
        AND schedule."created_by" = seller."user_id"
        AND schedule."updated_by" = seller."user_id"
    `);
  }
}
