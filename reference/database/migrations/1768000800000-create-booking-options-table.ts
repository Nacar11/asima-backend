import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingOptionsTable1768000800000
  implements MigrationInterface
{
  name = 'CreateBookingOptionsTable1768000800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "booking_options" (
        "id" SERIAL NOT NULL,
        "booking_id" integer NOT NULL,
        "option_group_id" integer,
        "option_value_id" integer,
        "group_name" character varying(255) NOT NULL,
        "group_code" character varying(100) NOT NULL,
        "value_label" character varying(255) NOT NULL,
        "value_code" character varying(100) NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "price_adjustment" numeric(12,2) NOT NULL DEFAULT 0,
        "duration_adjustment_minutes" integer NOT NULL DEFAULT 0,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_booking_options_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_booking_options_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_booking_options_option_group" FOREIGN KEY ("option_group_id") REFERENCES "service_option_groups"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_booking_options_option_value" FOREIGN KEY ("option_value_id") REFERENCES "service_option_values"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_booking_options_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_booking_options_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_booking_options_booking_id" ON "booking_options" ("booking_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_options_option_group_id" ON "booking_options" ("option_group_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_options_option_value_id" ON "booking_options" ("option_value_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_booking_options_option_value_id"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_options_option_group_id"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_options_booking_id"`);
    await queryRunner.query(`DROP TABLE "booking_options"`);
  }
}
