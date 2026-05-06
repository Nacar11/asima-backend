import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerBookingCapacity1766600000000
  implements MigrationInterface
{
  name = 'AddSellerBookingCapacity1766600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add booking capacity fields to sellers table
    await queryRunner.query(`
      ALTER TABLE "sellers" 
      ADD COLUMN "max_concurrent_bookings" integer NOT NULL DEFAULT 1
    `);

    await queryRunner.query(`
      ALTER TABLE "sellers" 
      ADD COLUMN "max_daily_bookings" integer NOT NULL DEFAULT 8
    `);

    await queryRunner.query(`
      ALTER TABLE "sellers" 
      ADD COLUMN "service_capacity_hours" numeric(4,2) NOT NULL DEFAULT 8
    `);

    // Make assigned_member_id nullable in bookings (if exists)
    await queryRunner
      .query(
        `
      ALTER TABLE "bookings" 
      ALTER COLUMN "assigned_member_id" DROP NOT NULL
    `,
      )
      .catch(() => {
        // Column might already be nullable or not exist
      });

    // Make package_id nullable in bookings (if exists)
    await queryRunner
      .query(
        `
      ALTER TABLE "bookings" 
      ALTER COLUMN "package_id" DROP NOT NULL
    `,
      )
      .catch(() => {
        // Column might already be nullable or not exist
      });

    // Remove seller_member_id from store_unavailability if it exists
    await queryRunner
      .query(
        `
      ALTER TABLE "store_unavailability" 
      DROP COLUMN IF EXISTS "seller_member_id"
    `,
      )
      .catch(() => {
        // Column might not exist
      });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove capacity fields from sellers table
    await queryRunner.query(`
      ALTER TABLE "sellers" DROP COLUMN IF EXISTS "max_concurrent_bookings"
    `);

    await queryRunner.query(`
      ALTER TABLE "sellers" DROP COLUMN IF EXISTS "max_daily_bookings"
    `);

    await queryRunner.query(`
      ALTER TABLE "sellers" DROP COLUMN IF EXISTS "service_capacity_hours"
    `);
  }
}
