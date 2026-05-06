import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add submitted_at field to booking_milestones table.
 *
 * This field is needed for the milestone auto-approval cron job to determine
 * when a milestone was submitted and whether it should be auto-approved
 * based on the auto_approve_after_hours threshold from the template.
 */
export class AddSubmittedAtToBookingMilestones1765600000000
  implements MigrationInterface
{
  name = 'AddSubmittedAtToBookingMilestones1765600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add submitted_at column to track when milestone was submitted for approval
    await queryRunner.query(`
      ALTER TABLE "booking_milestones" 
      ADD COLUMN "submitted_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL
    `);

    // Add auto_approve_after_hours column (copied from template when milestone is created)
    await queryRunner.query(`
      ALTER TABLE "booking_milestones" 
      ADD COLUMN "auto_approve_after_hours" INTEGER DEFAULT 48
    `);

    // Add index for efficient querying of pending auto-approvals
    await queryRunner.query(`
      CREATE INDEX "IDX_booking_milestones_submitted_at" 
      ON "booking_milestones" ("submitted_at") 
      WHERE "submitted_at" IS NOT NULL AND "status" = 'submitted'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_milestones_submitted_at"
    `);

    // Remove auto_approve_after_hours column
    await queryRunner.query(`
      ALTER TABLE "booking_milestones" 
      DROP COLUMN IF EXISTS "auto_approve_after_hours"
    `);

    // Remove submitted_at column
    await queryRunner.query(`
      ALTER TABLE "booking_milestones" 
      DROP COLUMN IF EXISTS "submitted_at"
    `);
  }
}
