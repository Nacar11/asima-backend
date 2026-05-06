import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOpenPlayEventsAndLinks1773400000000
  implements MigrationInterface
{
  name = 'CreateOpenPlayEventsAndLinks1773400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "open_play_events" (
        "id" SERIAL NOT NULL,
        "seller_id" integer NOT NULL,
        "service_id" integer NOT NULL,
        "event_date" date NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "title" character varying(255) NOT NULL DEFAULT 'Open Play',
        "description" text,
        "rate_per_person" numeric(12,2) NOT NULL DEFAULT '0',
        "max_applicants" integer NOT NULL DEFAULT '1',
        "status" character varying(20) NOT NULL DEFAULT 'Published',
        "registration_start_at" TIMESTAMPTZ,
        "registration_end_at" TIMESTAMPTZ,
        "store_unavailability_id" integer,
        "created_by" integer,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_open_play_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_open_play_events_seller" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_open_play_events_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_open_play_events_store_unavailability" FOREIGN KEY ("store_unavailability_id") REFERENCES "store_unavailability"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_open_play_events_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_open_play_events_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_open_play_events_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_open_play_events_seller_id" ON "open_play_events" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_open_play_events_service_id" ON "open_play_events" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_open_play_events_event_date" ON "open_play_events" ("event_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_open_play_events_status" ON "open_play_events" ("status")`,
    );

    await queryRunner.query(
      `ALTER TABLE "store_unavailability" ADD COLUMN "block_type" varchar(32) NOT NULL DEFAULT 'maintenance'`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" ADD COLUMN "open_play_event_id" integer`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_block_type" ON "store_unavailability" ("block_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_open_play_event_id" ON "store_unavailability" ("open_play_event_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "store_unavailability"
      ADD CONSTRAINT "FK_store_unavailability_open_play_event"
      FOREIGN KEY ("open_play_event_id") REFERENCES "open_play_events"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN "open_play_event_id" integer`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_open_play_event_id" ON "bookings" ("open_play_event_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "FK_bookings_open_play_event"
      FOREIGN KEY ("open_play_event_id") REFERENCES "open_play_events"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "FK_bookings_open_play_event"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_open_play_event_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "open_play_event_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "store_unavailability" DROP CONSTRAINT IF EXISTS "FK_store_unavailability_open_play_event"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_store_unavailability_open_play_event_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_store_unavailability_block_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" DROP COLUMN IF EXISTS "open_play_event_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" DROP COLUMN IF EXISTS "block_type"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_open_play_events_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_open_play_events_event_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_open_play_events_service_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_open_play_events_seller_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "open_play_events"`);
  }
}
