import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingGuestsTable1772700000002
  implements MigrationInterface
{
  name = 'CreateBookingGuestsTable1772700000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "guest_count" smallint NOT NULL DEFAULT 1`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'CHK_bookings_guest_count'
        ) THEN
          ALTER TABLE "bookings"
          ADD CONSTRAINT "CHK_bookings_guest_count"
          CHECK ("guest_count" BETWEEN 1 AND 7);
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bookings_guest_count" ON "bookings" ("guest_count")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "booking_guests" (
        "id" SERIAL NOT NULL,
        "booking_id" integer NOT NULL,
        "sort_order" smallint NOT NULL DEFAULT 1,
        "is_primary_contact" boolean NOT NULL DEFAULT false,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "email" character varying(100),
        "phone" character varying(30),
        "created_by" integer,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_booking_guests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_booking_guests_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_booking_guests_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_booking_guests_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_booking_guests_booking_id" ON "booking_guests" ("booking_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_booking_guests_booking_sort_order" ON "booking_guests" ("booking_id", "sort_order")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_booking_guests_primary_contact" ON "booking_guests" ("booking_id") WHERE "is_primary_contact" = true`,
    );

    await queryRunner.query(`
      INSERT INTO "booking_guests" (
        "booking_id",
        "sort_order",
        "is_primary_contact",
        "first_name",
        "last_name",
        "email",
        "phone",
        "created_by",
        "updated_by"
      )
      SELECT
        b."id",
        1,
        true,
        COALESCE(NULLIF(TRIM(u."first_name"), ''), 'Guest'),
        COALESCE(NULLIF(TRIM(u."last_name"), ''), 'User'),
        COALESCE(NULLIF(TRIM(b."guest_email"), ''), NULLIF(TRIM(u."email"), '')),
        NULLIF(TRIM(u."phone"), ''),
        u."id",
        u."id"
      FROM "bookings" b
      LEFT JOIN "user" u ON u."id" = b."customer_id"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "booking_guests" bg
        WHERE bg."booking_id" = b."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_booking_guests_primary_contact"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_booking_guests_booking_sort_order"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_booking_guests_booking_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "booking_guests"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_guest_count"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'CHK_bookings_guest_count'
        ) THEN
          ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_guest_count";
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "guest_count"`,
    );
  }
}
