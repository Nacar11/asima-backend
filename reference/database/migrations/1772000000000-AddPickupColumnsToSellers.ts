import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPickupColumnsToSellers1772000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD COLUMN "pickup_enabled" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN "pickup_address_id" INTEGER NULL,
      ADD COLUMN "pickup_preparation_time" INTEGER NOT NULL DEFAULT 30,
      ADD COLUMN "pickup_max_concurrent_orders" INTEGER NOT NULL DEFAULT 10,
      ADD COLUMN "pickup_instructions" TEXT NULL,
      ADD COLUMN "pickup_grace_period" INTEGER NOT NULL DEFAULT 120,
      ADD CONSTRAINT "fk_sellers_pickup_address_id" 
      FOREIGN KEY ("pickup_address_id") REFERENCES "user_addresses"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sellers_pickup_enabled" ON "sellers"("pickup_enabled")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sellers_pickup_enabled"
    `);

    await queryRunner.query(`
      ALTER TABLE "sellers"
      DROP COLUMN "pickup_enabled",
      DROP COLUMN "pickup_address_id",
      DROP COLUMN "pickup_preparation_time",
      DROP COLUMN "pickup_max_concurrent_orders",
      DROP COLUMN "pickup_instructions",
      DROP COLUMN "pickup_grace_period"
    `);
  }
}
