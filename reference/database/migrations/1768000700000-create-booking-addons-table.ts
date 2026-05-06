import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingAddonsTable1768000700000
  implements MigrationInterface
{
  name = 'CreateBookingAddonsTable1768000700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "booking_addons" (
        "id" SERIAL NOT NULL,
        "booking_id" integer NOT NULL,
        "addon_id" integer,
        "addon_name" character varying(255) NOT NULL,
        "addon_code" character varying(100) NOT NULL,
        "addon_description" text,
        "unit_type" character varying(100),
        "quantity" integer NOT NULL DEFAULT 1,
        "unit_price" numeric(12,2) NOT NULL,
        "total_price" numeric(12,2) NOT NULL,
        "duration_minutes" integer,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_booking_addons_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_booking_addons_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_booking_addons_addon" FOREIGN KEY ("addon_id") REFERENCES "service_addons"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_booking_addons_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_booking_addons_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_booking_addons_booking_id" ON "booking_addons" ("booking_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_addons_addon_id" ON "booking_addons" ("addon_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_booking_addons_booking_addon" ON "booking_addons" ("booking_id", "addon_id") WHERE "addon_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_booking_addons_booking_addon"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_addons_addon_id"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_addons_booking_id"`);
    await queryRunner.query(`DROP TABLE "booking_addons"`);
  }
}
