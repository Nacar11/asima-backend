import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create subscription_operations table.
 *
 * This migration creates the subscription_operations table for tracking
 * admin operations on subscriptions (manual renewal, extension, payment retry, etc.).
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateSubscriptionOperationsTable1765560000000
  implements MigrationInterface
{
  name = 'CreateSubscriptionOperationsTable1765560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for operation types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "subscription_operation_type_enum" AS ENUM(
          'renew',
          'extend',
          'cancel',
          'refund',
          'retry_payment',
          'suspend',
          'activate'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create subscription_operations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription_operations" (
        "id" SERIAL NOT NULL,
        "subscription_id" INTEGER NOT NULL,
        "operation_type" "subscription_operation_type_enum" NOT NULL,
        "performed_by" INTEGER NOT NULL,
        "reason" TEXT,
        "metadata" JSONB,
        "performed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_operations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_operations_subscription" 
          FOREIGN KEY ("subscription_id") 
          REFERENCES "subscriptions"("id") 
          ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_operations_subscription_id" 
      ON "subscription_operations"("subscription_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_operations_operation_type" 
      ON "subscription_operations"("operation_type")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_operations_performed_at" 
      ON "subscription_operations"("performed_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_operations_performed_by" 
      ON "subscription_operations"("performed_by")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscription_operations_performed_by"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscription_operations_performed_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscription_operations_operation_type"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscription_operations_subscription_id"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_operations"`);

    // Drop enum type
    await queryRunner.query(
      `DROP TYPE IF EXISTS "subscription_operation_type_enum"`,
    );
  }
}
