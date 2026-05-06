import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMayaWebhookEvents1772600000000
  implements MigrationInterface
{
  name = 'CreateMayaWebhookEvents1772600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "maya_webhook_events" (
        "id" SERIAL NOT NULL,
        "provider_event_id" character varying(191) NOT NULL,
        "event_type" character varying(100),
        "txnid" character varying(100),
        "signature" character varying(100),
        "payload" jsonb NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'pending',
        "error_message" text,
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maya_webhook_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_maya_webhook_events_provider_event_id" UNIQUE ("provider_event_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_maya_webhook_events_provider_event_id"
      ON "maya_webhook_events" ("provider_event_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_maya_webhook_events_txnid"
      ON "maya_webhook_events" ("txnid")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_maya_webhook_events_status"
      ON "maya_webhook_events" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_maya_webhook_events_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_maya_webhook_events_txnid"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_maya_webhook_events_provider_event_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "maya_webhook_events"`);
  }
}
