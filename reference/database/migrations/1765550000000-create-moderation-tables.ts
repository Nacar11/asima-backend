import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create moderation tables.
 *
 * This migration creates the moderation_items, moderation_actions, and content_reports
 * tables for content moderation system. Supports moderation queue, content reporting,
 * moderation actions, and moderation history tracking.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateModerationTables1765550000000 implements MigrationInterface {
  name = 'CreateModerationTables1765550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "content_type_enum" AS ENUM(
          'service',
          'review',
          'message',
          'profile',
          'image'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "moderation_status_enum" AS ENUM(
          'pending',
          'approved',
          'rejected',
          'flagged'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "moderation_priority_enum" AS ENUM(
          'low',
          'medium',
          'high',
          'urgent'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "moderation_action_type_enum" AS ENUM(
          'approve',
          'reject',
          'flag',
          'suspend',
          'delete'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "report_status_enum" AS ENUM(
          'pending',
          'reviewed',
          'resolved',
          'dismissed'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create moderation_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "moderation_items" (
        "id" SERIAL NOT NULL,
        "content_type" "content_type_enum" NOT NULL,
        "content_id" INTEGER NOT NULL,
        "reported_by" INTEGER,
        "reported_reason" TEXT,
        "status" "moderation_status_enum" NOT NULL DEFAULT 'pending',
        "priority" "moderation_priority_enum" NOT NULL DEFAULT 'medium',
        "reviewed_by" INTEGER,
        "reviewed_at" TIMESTAMP WITH TIME ZONE,
        "admin_notes" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_moderation_items" PRIMARY KEY ("id")
      )
    `);

    // Create moderation_actions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "moderation_actions" (
        "id" SERIAL NOT NULL,
        "moderation_item_id" INTEGER NOT NULL,
        "action" "moderation_action_type_enum" NOT NULL,
        "reason" TEXT NOT NULL,
        "admin_notes" TEXT,
        "performed_by" INTEGER NOT NULL,
        "performed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_moderation_actions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_moderation_actions_moderation_item" 
          FOREIGN KEY ("moderation_item_id") 
          REFERENCES "moderation_items"("id") 
          ON DELETE CASCADE
      )
    `);

    // Create content_reports table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "content_reports" (
        "id" SERIAL NOT NULL,
        "content_type" "content_type_enum" NOT NULL,
        "content_id" INTEGER NOT NULL,
        "reported_by" INTEGER NOT NULL,
        "reason" TEXT NOT NULL,
        "details" TEXT,
        "status" "report_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_reports" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for moderation_items
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_moderation_items_content_type" 
      ON "moderation_items"("content_type")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_moderation_items_content_id" 
      ON "moderation_items"("content_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_moderation_items_status" 
      ON "moderation_items"("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_moderation_items_priority" 
      ON "moderation_items"("priority")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_moderation_items_created_at" 
      ON "moderation_items"("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_moderation_items_content_type_id" 
      ON "moderation_items"("content_type", "content_id")
    `);

    // Create indexes for moderation_actions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_moderation_actions_moderation_item_id" 
      ON "moderation_actions"("moderation_item_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_moderation_actions_performed_at" 
      ON "moderation_actions"("performed_at")
    `);

    // Create indexes for content_reports
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_reports_content_type" 
      ON "content_reports"("content_type")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_reports_content_id" 
      ON "content_reports"("content_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_reports_status" 
      ON "content_reports"("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_reports_content_type_id" 
      ON "content_reports"("content_type", "content_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_content_reports_content_type_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_content_reports_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_content_reports_content_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_content_reports_content_type"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_moderation_actions_performed_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_moderation_actions_moderation_item_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_moderation_items_content_type_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_moderation_items_created_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_moderation_items_priority"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_moderation_items_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_moderation_items_content_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_moderation_items_content_type"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "content_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "moderation_actions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "moderation_items"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "report_status_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "moderation_action_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "moderation_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "moderation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_type_enum"`);
  }
}
