import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Align notification scheduler queries with database schema.
 *
 * Adds missing notification-tracking and due-date columns used by
 * NotificationsSchedulerService on bookings, booking_milestones, and quote_requests.
 */
export class AddNotificationTrackingColumns1772800000000
  implements MigrationInterface
{
  name = 'AddNotificationTrackingColumns1772800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "starting_soon_notified" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "reminder_notified" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "pending_confirmation_notified" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "review_reminder_notified" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "deadline_warning_notified" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "overdue_notified" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD COLUMN IF NOT EXISTS "expiring_soon_notified" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "expired_notified" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      DROP COLUMN IF EXISTS "expired_notified",
      DROP COLUMN IF EXISTS "expiring_soon_notified"
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      DROP COLUMN IF EXISTS "overdue_notified",
      DROP COLUMN IF EXISTS "deadline_warning_notified",
      DROP COLUMN IF EXISTS "due_date"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "review_reminder_notified",
      DROP COLUMN IF EXISTS "pending_confirmation_notified",
      DROP COLUMN IF EXISTS "reminder_notified",
      DROP COLUMN IF EXISTS "starting_soon_notified"
    `);
  }
}
