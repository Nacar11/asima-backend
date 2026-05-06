import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPickupConfirmationCodeToSalesOrders1772000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN "pickup_confirmation_code" VARCHAR(4) NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_sales_orders_pickup_confirmation_code"
      ON "sales_orders"("pickup_confirmation_code")
      WHERE "pickup_confirmation_code" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sales_orders_pickup_confirmation_code"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      DROP COLUMN "pickup_confirmation_code"
    `);
  }
}
