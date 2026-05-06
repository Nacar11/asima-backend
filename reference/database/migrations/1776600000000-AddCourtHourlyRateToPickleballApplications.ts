import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourtHourlyRateToPickleballApplications1776600000000
  implements MigrationInterface
{
  name = 'AddCourtHourlyRateToPickleballApplications1776600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pickleball_merchant_application_courts"
      ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(12, 2) NOT NULL DEFAULT 200
    `);

    await queryRunner.query(`
      UPDATE "pickleball_merchant_application_courts"
      SET "hourly_rate" = 200
      WHERE "hourly_rate" IS NULL OR "hourly_rate" <= 0
    `);

    // Backfill existing independent merchant venue services that were created
    // with hourly_rate = 0 so guest bookings stop short-circuiting to
    // AWAITING_CONFIRMATION because of a zero total amount.
    await queryRunner.query(`
      UPDATE "services" service
      SET "hourly_rate" = 200,
          "base_price" = 200
      FROM "pickleball_locations" location
      WHERE service."seller_id" = location."seller_id"
        AND location."source_type" = 'independent_merchant'
        AND location."deleted_at" IS NULL
        AND service."deleted_at" IS NULL
        AND service."service_type"::text = 'venue'
        AND (service."hourly_rate" IS NULL OR service."hourly_rate" <= 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pickleball_merchant_application_courts"
      DROP COLUMN IF EXISTS "hourly_rate"
    `);
  }
}
