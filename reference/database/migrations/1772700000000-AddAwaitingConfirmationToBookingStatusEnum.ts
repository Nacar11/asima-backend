import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAwaitingConfirmationToBookingStatusEnum1772700000000
  implements MigrationInterface
{
  name = 'AddAwaitingConfirmationToBookingStatusEnum1772700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'booking_status_enum'
            AND e.enumlabel = 'awaiting_confirmation'
        ) THEN
          ALTER TYPE "booking_status_enum" ADD VALUE 'awaiting_confirmation';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL enum values cannot be removed safely in-place.
    // Keep this migration irreversible.
  }
}
