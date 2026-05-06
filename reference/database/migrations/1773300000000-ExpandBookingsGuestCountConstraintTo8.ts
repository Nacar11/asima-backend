import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandBookingsGuestCountConstraintTo81773300000000
  implements MigrationInterface
{
  name = 'ExpandBookingsGuestCountConstraintTo81773300000000';

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
        CHECK ("guest_count" BETWEEN 1 AND 8);
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
        CHECK ("guest_count" BETWEEN 1 AND 7);
      END $$;
    `);
  }
}
