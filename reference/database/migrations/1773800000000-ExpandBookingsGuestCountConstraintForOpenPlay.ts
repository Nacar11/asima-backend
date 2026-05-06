import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandBookingsGuestCountConstraintForOpenPlay1773800000000
  implements MigrationInterface
{
  name = 'ExpandBookingsGuestCountConstraintForOpenPlay1773800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'CHK_bookings_guest_count'
        ) THEN
          ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_guest_count";
        END IF;

        ALTER TABLE "bookings"
        ADD CONSTRAINT "CHK_bookings_guest_count"
        CHECK (
          CASE
            WHEN COALESCE("open_play_event_id", 0) > 0
              THEN "guest_count" BETWEEN 1 AND 32
            ELSE "guest_count" BETWEEN 1 AND 8
          END
        );
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'CHK_bookings_guest_count'
        ) THEN
          ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_guest_count";
        END IF;

        ALTER TABLE "bookings"
        ADD CONSTRAINT "CHK_bookings_guest_count"
        CHECK ("guest_count" BETWEEN 1 AND 8);
      END $$;
    `);
  }
}
