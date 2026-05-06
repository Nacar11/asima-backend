import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create messaging tables.
 *
 * This migration creates the conversations and messages tables for in-app messaging
 * between customers and service providers. Supports text, image, and file messages
 * with read receipts and conversation context linking.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateMessagingTables1765540000000 implements MigrationInterface {
  name = 'CreateMessagingTables1765540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "message_type_enum" AS ENUM(
          'text',
          'image',
          'file',
          'system'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "conversation_status_enum" AS ENUM(
          'active',
          'archived',
          'blocked'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "context_type_enum" AS ENUM(
          'general',
          'booking',
          'sales_order',
          'inquiry'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create conversations table
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" SERIAL PRIMARY KEY,
        
        -- Participants
        "seller_id" integer NOT NULL,
        "customer_id" integer NOT NULL,
        
        -- Context (optional - links conversation to booking/order)
        "context_type" "context_type_enum",
        "context_id" integer,
        
        -- Status
        "status" "conversation_status_enum" NOT NULL DEFAULT 'active',
        
        -- Last message tracking
        "last_message_at" TIMESTAMP WITH TIME ZONE,
        
        -- Audit fields
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        
        -- Foreign keys
        CONSTRAINT "FK_conversations_seller" FOREIGN KEY ("seller_id") 
          REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversations_customer" FOREIGN KEY ("customer_id") 
          REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversations_created_by" FOREIGN KEY ("created_by") 
          REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_conversations_updated_by" FOREIGN KEY ("updated_by") 
          REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_conversations_deleted_by" FOREIGN KEY ("deleted_by") 
          REFERENCES "user"("id") ON DELETE SET NULL,
        
        -- Unique constraint: one conversation per seller-customer pair per context
        CONSTRAINT "UQ_conversations_participants_context" 
          UNIQUE ("seller_id", "customer_id", "context_type", "context_id")
      );
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" SERIAL PRIMARY KEY,
        
        -- Conversation
        "conversation_id" integer NOT NULL,
        
        -- Sender
        "sender_id" integer NOT NULL,
        
        -- Message content
        "message_type" "message_type_enum" NOT NULL DEFAULT 'text',
        "content" text,
        
        -- Attachments (JSONB for flexibility)
        "attachments" jsonb,
        
        -- Read status
        "read_at" TIMESTAMP WITH TIME ZONE,
        
        -- Timestamps
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        
        -- Foreign keys
        CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") 
          REFERENCES "conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id") 
          REFERENCES "user"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_seller_id" ON "conversations" ("seller_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_customer_id" ON "conversations" ("customer_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_last_message_at" ON "conversations" ("last_message_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_status" ON "conversations" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_context" ON "conversations" ("context_type", "context_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_conversation_id" ON "messages" ("conversation_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_sender_id" ON "messages" ("sender_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_created_at" ON "messages" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_read_at" ON "messages" ("read_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_read_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sender_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_messages_conversation_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_context"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversations_last_message_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversations_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversations_seller_id"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "context_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conversation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "message_type_enum"`);
  }
}
