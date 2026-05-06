import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompletedAtToSalesOrders1764742400000
  implements MigrationInterface
{
  name = 'AddCompletedAtToSalesOrders1764742400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales_orders"
      ADD COLUMN IF NOT EXISTS "completed_at" timestamp NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "completed_at"
    `);
  }
}
