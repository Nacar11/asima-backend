import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSellersExtend1765000200000 implements MigrationInterface {
  name = 'AlterSellersExtend1765000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."sellers_business_type_enum" AS ENUM('sole_proprietor', 'partnership', 'corporation')
    `);

    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD COLUMN "code" character varying(255),
      ADD COLUMN "sells_products" boolean NOT NULL DEFAULT true,
      ADD COLUMN "sells_services" boolean NOT NULL DEFAULT false,
      ADD COLUMN "business_type" "public"."sellers_business_type_enum",
      ADD COLUMN "bio" text,
      ADD COLUMN "years_of_experience" integer,
      ADD COLUMN "hourly_rate" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN "auto_accept_bookings" boolean NOT NULL DEFAULT false,
      ADD COLUMN "average_rating" numeric(2,1) NOT NULL DEFAULT 0,
      ADD COLUMN "total_services" integer NOT NULL DEFAULT 0,
      ADD COLUMN "total_completed_bookings" integer NOT NULL DEFAULT 0
    `);

    // backfill code using store_name slugified (basic replacement)
    await queryRunner.query(`
      UPDATE "sellers"
      SET "code" = lower(regexp_replace(store_name, '[^a-zA-Z0-9]+', '-', 'g'))
    `);

    await queryRunner.query(`
      ALTER TABLE "sellers"
      ALTER COLUMN "code" SET NOT NULL
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sellers_code" ON "sellers" ("code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP CONSTRAINT "UQ_sellers_code"`,
    );

    await queryRunner.query(`
      ALTER TABLE "sellers"
      DROP COLUMN "total_completed_bookings",
      DROP COLUMN "total_services",
      DROP COLUMN "average_rating",
      DROP COLUMN "auto_accept_bookings",
      DROP COLUMN "hourly_rate",
      DROP COLUMN "years_of_experience",
      DROP COLUMN "bio",
      DROP COLUMN "business_type",
      DROP COLUMN "sells_services",
      DROP COLUMN "sells_products",
      DROP COLUMN "code"
    `);

    await queryRunner.query(`DROP TYPE "public"."sellers_business_type_enum"`);
  }
}
