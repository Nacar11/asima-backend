import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create booking_milestones table
 *
 * Creates the booking_milestones table for tracking service booking progress
 * through milestone-based workflows. Supports payment release, approval workflows,
 * and milestone status tracking.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateBookingMilestonesTable1765450000000
  implements MigrationInterface
{
  name = 'CreateBookingMilestonesTable1765450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create milestone_status_enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "milestone_status_enum" AS ENUM(
          'pending',
          'in_progress',
          'submitted',
          'approved',
          'rejected',
          'skipped'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create booking_milestones table
    await queryRunner.query(`
      CREATE TABLE "booking_milestones" (
        "id" SERIAL PRIMARY KEY,
        "booking_id" integer NOT NULL,
        "template_id" integer,
        
        "name" varchar(255) NOT NULL,
        "description" text,
        "sequence_order" integer NOT NULL,
        
        "status" milestone_status_enum DEFAULT 'pending' NOT NULL,
        
        "started_at" timestamp,
        "completed_at" timestamp,
        "approved_at" timestamp,
        
        "payment_percent" decimal(5,2) NOT NULL,
        "payment_amount" decimal(10,2) NOT NULL,
        "payment_released" boolean DEFAULT false NOT NULL,
        "payment_released_at" timestamp,
        
        "customer_notes" text,
        "rejection_reason" text,
        "provider_notes" text,
        
        "approved_by" integer,
        "auto_approved" boolean DEFAULT false NOT NULL,
        
        "created_by" integer,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_by" integer,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_by" integer,
        "deleted_at" timestamp
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_booking_milestones_booking_id" ON "booking_milestones" ("booking_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_booking_milestones_status" ON "booking_milestones" ("status");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_booking_milestones_booking_id_sequence_order" 
      ON "booking_milestones" ("booking_id", "sequence_order");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_booking_milestones_deleted_at" ON "booking_milestones" ("deleted_at");
    `);

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD CONSTRAINT "FK_booking_milestones_booking_id"
      FOREIGN KEY ("booking_id") REFERENCES "bookings"("id")
      ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD CONSTRAINT "FK_booking_milestones_template_id"
      FOREIGN KEY ("template_id") REFERENCES "service_milestone_templates"("id")
      ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD CONSTRAINT "FK_booking_milestones_approved_by"
      FOREIGN KEY ("approved_by") REFERENCES "user"("id")
      ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD CONSTRAINT "FK_booking_milestones_created_by"
      FOREIGN KEY ("created_by") REFERENCES "user"("id")
      ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD CONSTRAINT "FK_booking_milestones_updated_by"
      FOREIGN KEY ("updated_by") REFERENCES "user"("id")
      ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD CONSTRAINT "FK_booking_milestones_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "user"("id")
      ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      DROP CONSTRAINT IF EXISTS "FK_booking_milestones_deleted_by";
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      DROP CONSTRAINT IF EXISTS "FK_booking_milestones_updated_by";
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      DROP CONSTRAINT IF EXISTS "FK_booking_milestones_created_by";
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      DROP CONSTRAINT IF EXISTS "FK_booking_milestones_approved_by";
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      DROP CONSTRAINT IF EXISTS "FK_booking_milestones_template_id";
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      DROP CONSTRAINT IF EXISTS "FK_booking_milestones_booking_id";
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_milestones_deleted_at";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_milestones_booking_id_sequence_order";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_milestones_status";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_milestones_booking_id";
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "booking_milestones"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "milestone_status_enum"`);
  }
}
