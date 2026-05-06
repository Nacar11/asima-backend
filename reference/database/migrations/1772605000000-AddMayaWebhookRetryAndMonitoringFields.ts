import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMayaWebhookRetryAndMonitoringFields1772605000000
  implements MigrationInterface
{
  name = 'AddMayaWebhookRetryAndMonitoringFields1772605000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "maya_webhook_events"
      ADD COLUMN IF NOT EXISTS "retry_count" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "next_retry_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "duplicate_count" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "last_duplicate_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "processing_started_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "processing_latency_ms" integer
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_maya_webhook_events_next_retry_at"
      ON "maya_webhook_events" ("next_retry_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_maya_webhook_events_retry_count"
      ON "maya_webhook_events" ("retry_count")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_maya_webhook_events_retry_count"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_maya_webhook_events_next_retry_at"`,
    );

    await queryRunner.query(`
      ALTER TABLE "maya_webhook_events"
      DROP COLUMN IF EXISTS "processing_latency_ms",
      DROP COLUMN IF EXISTS "processing_started_at",
      DROP COLUMN IF EXISTS "last_duplicate_at",
      DROP COLUMN IF EXISTS "duplicate_count",
      DROP COLUMN IF EXISTS "next_retry_at",
      DROP COLUMN IF EXISTS "retry_count"
    `);
  }
}
