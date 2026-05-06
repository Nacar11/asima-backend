import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestPaymentMethodToBookings1772700000001
  implements MigrationInterface
{
  name = 'AddGuestPaymentMethodToBookings1772700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "guest_payment_method" character varying(30) NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bookings_guest_payment_method" ON "bookings" ("guest_payment_method")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_guest_payment_method"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "guest_payment_method"`,
    );
  }
}
