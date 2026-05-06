import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to extend reviews table for service and booking reviews.
 *
 * This migration adds support for reviewing services and bookings,
 * in addition to the existing product reviews.
 *
 * @version 1
 * @since 1.0.0
 */
export class ExtendReviewsForServices1765500000000
  implements MigrationInterface
{
  name = 'ExtendReviewsForServices1765500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."reviews_reviewable_type_enum" AS ENUM('product', 'service', 'seller')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reviews_source_type_enum" AS ENUM('sales_order', 'booking')`,
    );

    // Make product_id nullable
    await queryRunner.query(
      `ALTER TABLE "reviews" ALTER COLUMN "product_id" DROP NOT NULL`,
    );

    // Add new columns
    await queryRunner.query(
      `ALTER TABLE "reviews" 
        ADD COLUMN "reviewable_type" "public"."reviews_reviewable_type_enum" NOT NULL DEFAULT 'product',
        ADD COLUMN "source_type" "public"."reviews_source_type_enum",
        ADD COLUMN "source_id" integer,
        ADD COLUMN "service_id" integer,
        ADD COLUMN "booking_id" integer,
        ADD COLUMN "aspect_ratings" jsonb`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_reviewable_type" ON "reviews" ("reviewable_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_source_type" ON "reviews" ("source_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_source_id" ON "reviews" ("source_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_service_id" ON "reviews" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_booking_id" ON "reviews" ("booking_id")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "reviews" 
        ADD CONSTRAINT "FK_reviews_service_id" 
        FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" 
        ADD CONSTRAINT "FK_reviews_booking_id" 
        FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT`,
    );

    // Update existing reviews to have reviewable_type = 'product'
    await queryRunner.query(
      `UPDATE "reviews" SET "reviewable_type" = 'product' WHERE "reviewable_type" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_booking_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_service_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_reviews_booking_id"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_service_id"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_source_id"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_source_type"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_reviewable_type"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "reviews" 
        DROP COLUMN "aspect_ratings",
        DROP COLUMN "booking_id",
        DROP COLUMN "service_id",
        DROP COLUMN "source_id",
        DROP COLUMN "source_type",
        DROP COLUMN "reviewable_type"`,
    );

    // Make product_id NOT NULL again
    await queryRunner.query(
      `ALTER TABLE "reviews" ALTER COLUMN "product_id" SET NOT NULL`,
    );

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."reviews_source_type_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."reviews_reviewable_type_enum"`,
    );
  }
}
