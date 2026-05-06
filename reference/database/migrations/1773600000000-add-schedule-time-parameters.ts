import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScheduleTimeParameters1773600000000
  implements MigrationInterface
{
  name = 'AddScheduleTimeParameters1773600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "parameter" (
        "code",
        "param_items",
        "description",
        "string_value",
        "status",
        "created_at",
        "updated_at"
      )
      SELECT
        'schedule_time_storage_mode',
        'Scheduling',
        'Controls seller schedule TIME interpretation: local or utc_clock',
        'local',
        'Active',
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1
        FROM "parameter"
        WHERE "code" = 'schedule_time_storage_mode'
          AND "deleted_at" IS NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "parameter" (
        "code",
        "param_items",
        "description",
        "string_value",
        "status",
        "created_at",
        "updated_at"
      )
      SELECT
        'schedule_timezone',
        'Scheduling',
        'IANA timezone for seller schedule interpretation',
        'Asia/Manila',
        'Active',
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1
        FROM "parameter"
        WHERE "code" = 'schedule_timezone'
          AND "deleted_at" IS NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "parameter"
      WHERE "code" IN ('schedule_time_storage_mode', 'schedule_timezone')
        AND "param_items" = 'Scheduling'
        AND "created_by" IS NULL
        AND "updated_by" IS NULL
    `);
  }
}
