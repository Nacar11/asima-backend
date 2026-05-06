import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionRateToSalesOrders1776300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sales_orders
      ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sales_orders DROP COLUMN IF EXISTS commission_rate
    `);
  }
}
