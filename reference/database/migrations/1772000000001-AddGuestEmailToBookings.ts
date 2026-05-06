import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestEmailToBookings1772000000001
  implements MigrationInterface
{
  name = 'AddGuestEmailToBookings1772000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN "guest_email" character varying(100) NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_guest_email" ON "bookings" ("guest_email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_guest_email"`);
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "guest_email"`,
    );
  }
}
