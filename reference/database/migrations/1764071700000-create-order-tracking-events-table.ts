import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create order_tracking_events table.
 *
 * This migration creates the order_tracking_events table that stores
 * immutable audit trail of all order status changes. Each event is
 * timestamped for real-time tracking and enables customer notifications.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateOrderTrackingEventsTable1764071700000
  implements MigrationInterface
{
  name = 'CreateOrderTrackingEventsTable1764071700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_tracking_events" (
        "id" SERIAL PRIMARY KEY,
        "order_id" integer NOT NULL,
        "event_type" character varying NOT NULL,
        "description" text,
        "location" character varying(255),
        "latitude" numeric(10,8),
        "longitude" numeric(10,8),
        "event_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_tracking_events_order_id"
          FOREIGN KEY ("order_id")
          REFERENCES "sales_orders"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_order_tracking_events_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_tracking_events_order_id"
      ON "order_tracking_events" ("order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_tracking_events_event_type"
      ON "order_tracking_events" ("event_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_tracking_events_event_timestamp"
      ON "order_tracking_events" ("event_timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_tracking_events_order_timestamp"
      ON "order_tracking_events" ("order_id", "event_timestamp")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_order_tracking_events_order_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_order_tracking_events_event_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_order_tracking_events_event_type"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_order_tracking_events_order_id"`);
    await queryRunner.query(`DROP TABLE "order_tracking_events"`);
  }
}
