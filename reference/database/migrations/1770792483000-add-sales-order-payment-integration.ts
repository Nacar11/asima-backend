import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesOrderPaymentIntegration1770792483000
  implements MigrationInterface
{
  name = 'AddSalesOrderPaymentIntegration1770792483000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make checkout_order_id nullable (was NOT NULL)
    await queryRunner.query(
      `ALTER TABLE "checkout_payments" ALTER COLUMN "checkout_order_id" DROP NOT NULL`,
    );

    // Add sales_order_id to checkout_payments
    await queryRunner.query(
      `ALTER TABLE "checkout_payments" ADD COLUMN "sales_order_id" integer NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_checkout_payments_sales_order_id" ON "checkout_payments" ("sales_order_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_payments" ADD CONSTRAINT "FK_checkout_payments_sales_order_id" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT`,
    );

    // Add payment tracking fields to sales_orders
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD COLUMN "payment_method" varchar(50) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD COLUMN "payment_status" varchar(30) NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sales_orders_payment_status" ON "sales_orders" ("payment_status")`,
    );

    // Return Requests — add payout tracking columns
    await queryRunner.query(
      `ALTER TABLE "return_requests" ADD COLUMN "payment_refund_status" varchar(30) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" ADD COLUMN "payment_refund_amount" decimal(10,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" ADD COLUMN "payment_refund_at" timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" ADD COLUMN "payment_refund_by" integer NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" ADD COLUMN "payment_refund_reference" varchar(255) NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_return_requests_payment_refund_status" ON "return_requests" ("payment_refund_status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop return_requests payout columns
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_payment_refund_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "payment_refund_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "payment_refund_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "payment_refund_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "payment_refund_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "payment_refund_status"`,
    );

    // Drop sales_orders payment columns
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_orders_payment_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "payment_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "payment_method"`,
    );

    // Drop checkout_payments sales_order_id
    await queryRunner.query(
      `ALTER TABLE "checkout_payments" DROP CONSTRAINT IF EXISTS "FK_checkout_payments_sales_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_checkout_payments_sales_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_payments" DROP COLUMN IF EXISTS "sales_order_id"`,
    );

    // Restore checkout_order_id NOT NULL
    await queryRunner.query(
      `ALTER TABLE "checkout_payments" ALTER COLUMN "checkout_order_id" SET NOT NULL`,
    );
  }
}
