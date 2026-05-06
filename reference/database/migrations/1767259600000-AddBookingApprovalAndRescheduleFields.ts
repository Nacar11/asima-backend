import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingApprovalAndRescheduleFields1767259600000
  implements MigrationInterface
{
  name = 'AddBookingApprovalAndRescheduleFields1767259600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add customer approval fields to bookings table
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_approved" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_approved_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_feedback" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_rating" smallint`,
    );

    // Add reschedule request fields to bookings table
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reschedule_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reschedule_suggested_times" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reschedule_requested_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reschedule_requested_by" varchar(20)`,
    );

    // Add location_additional_fee to shopping_cart_items table
    await queryRunner.query(
      `ALTER TABLE "shopping_cart_items" ADD COLUMN IF NOT EXISTS "location_additional_fee" decimal(10,2) DEFAULT 0`,
    );

    // Add reschedule_requested status to booking_status_enum if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'booking_status_enum' AND e.enumlabel = 'reschedule_requested'
        ) THEN
          ALTER TYPE "booking_status_enum" ADD VALUE 'reschedule_requested';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove location_additional_fee from shopping_cart_items
    await queryRunner.query(
      `ALTER TABLE "shopping_cart_items" DROP COLUMN IF EXISTS "location_additional_fee"`,
    );

    // Remove reschedule request fields from bookings
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "reschedule_requested_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "reschedule_requested_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "reschedule_suggested_times"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "reschedule_reason"`,
    );

    // Remove customer approval fields from bookings
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "customer_rating"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "customer_feedback"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "customer_approved_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "customer_approved"`,
    );

    // Note: Cannot remove enum value in PostgreSQL easily
  }
}
