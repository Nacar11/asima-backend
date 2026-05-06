import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckoutSourceToSalesOrders1771000000000
  implements MigrationInterface
{
  name = 'AddCheckoutSourceToSalesOrders1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD "checkout_source" varchar(50) NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sales_orders_checkout_source" ON "sales_orders" ("checkout_source")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_sales_orders_checkout_source"`);
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN "checkout_source"`,
    );
  }
}
