import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingGroupNumberToBookings1773500000000
  implements MigrationInterface
{
  name = 'AddBookingGroupNumberToBookings1773500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "booking_group_number" character varying(50) NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bookings_booking_group_number" ON "bookings" ("booking_group_number")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_booking_group_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "booking_group_number"`,
    );
  }
}
