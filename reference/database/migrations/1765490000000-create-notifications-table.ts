import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create notifications table.
 *
 * This migration creates the notifications table for tracking
 * in-app and push notifications for users.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateNotificationsTable1765490000000
  implements MigrationInterface
{
  name = 'CreateNotificationsTable1765490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        
        -- Notification Type
        "type" varchar(50) NOT NULL,
        -- booking_confirmed, order_shipped, milestone_approved, etc.
        
        -- Content
        "title" varchar(255) NOT NULL,
        "body" text,
        
        -- Related Entity
        "entity_type" varchar(30),
        "entity_id" integer,
        
        -- Deep Link
        "action_url" varchar(500),
        
        -- Status
        "read_at" TIMESTAMP WITH TIME ZONE,
        
        -- Push Notification
        "push_sent" boolean NOT NULL DEFAULT false,
        "push_sent_at" TIMESTAMP WITH TIME ZONE,
        
        -- Timestamp
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        
        CONSTRAINT "FK_notifications_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_id" ON "notifications"("user_id");
      CREATE INDEX "IDX_notifications_type" ON "notifications"("type");
      CREATE INDEX "IDX_notifications_read_at" ON "notifications"("read_at");
      CREATE INDEX "IDX_notifications_created_at" ON "notifications"("created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_notifications_created_at";
      DROP INDEX IF EXISTS "IDX_notifications_read_at";
      DROP INDEX IF EXISTS "IDX_notifications_type";
      DROP INDEX IF EXISTS "IDX_notifications_user_id";
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
