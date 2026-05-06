import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migrate service_areas from service-level to seller-level.
 *
 * BREAKING CHANGE: Service areas are now defined at the seller level
 * instead of per-service. This simplifies provider onboarding and
 * matches real-world business model where providers cover geographic
 * areas for all their services.
 *
 * Migration Strategy:
 * 1. Add seller_id column (nullable initially)
 * 2. Backfill seller_id from service.seller_id
 * 3. Make seller_id NOT NULL
 * 4. Make service_id nullable (deprecated)
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export class MigrateServiceAreasToSeller1769000500000
  implements MigrationInterface
{
  name = 'MigrateServiceAreasToSeller1769000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Phase 1: Add seller_id column (nullable initially)
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ADD COLUMN "seller_id" INTEGER
    `);

    // Phase 2: Backfill seller_id from service.seller_id
    await queryRunner.query(`
      UPDATE "service_areas" sa
      SET "seller_id" = s."seller_id"
      FROM "services" s
      WHERE sa."service_id" = s."id"
      AND sa."seller_id" IS NULL
    `);

    // Handle any orphaned records (service_id points to deleted service)
    // Set seller_id to a default value or delete these records
    await queryRunner.query(`
      DELETE FROM "service_areas"
      WHERE "seller_id" IS NULL
    `);

    // Phase 3: Make seller_id NOT NULL
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ALTER COLUMN "seller_id" SET NOT NULL
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ADD CONSTRAINT "FK_service_areas_seller_id"
      FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE
    `);

    // Add index for seller_id queries
    await queryRunner.query(`
      CREATE INDEX "IDX_service_areas_seller_id" ON "service_areas" ("seller_id")
    `);

    // Phase 4: Make service_id nullable (deprecated)
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ALTER COLUMN "service_id" DROP NOT NULL
    `);

    // Update foreign key to SET NULL on delete
    // First check if the constraint exists and drop it
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      DROP CONSTRAINT IF EXISTS "FK_service_areas_service_id"
    `);

    // Also try the TypeORM generated constraint name
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      DROP CONSTRAINT IF EXISTS "FK_service_areas_service"
    `);

    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ADD CONSTRAINT "FK_service_areas_service_id"
      FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore service_id as required
    // First, we need to ensure all records have a service_id
    // This may fail if there are records without service_id
    await queryRunner.query(`
      DELETE FROM "service_areas"
      WHERE "service_id" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ALTER COLUMN "service_id" SET NOT NULL
    `);

    // Restore original foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "service_areas"
      DROP CONSTRAINT IF EXISTS "FK_service_areas_service_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "service_areas"
      ADD CONSTRAINT "FK_service_areas_service_id"
      FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
    `);

    // Drop seller relationship
    await queryRunner.query(`DROP INDEX "IDX_service_areas_seller_id"`);

    await queryRunner.query(`
      ALTER TABLE "service_areas"
      DROP CONSTRAINT "FK_service_areas_seller_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "service_areas"
      DROP COLUMN "seller_id"
    `);
  }
}
