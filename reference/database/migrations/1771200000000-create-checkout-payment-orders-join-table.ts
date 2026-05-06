import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCheckoutPaymentOrdersJoinTable1771200000000
  implements MigrationInterface
{
  name = 'CreateCheckoutPaymentOrdersJoinTable1771200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create join table
    await queryRunner.query(`
      CREATE TABLE "checkout_payment_orders" (
        "id" SERIAL NOT NULL,
        "checkout_payment_id" integer NOT NULL,
        "sales_order_id" integer NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_checkout_payment_orders" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_checkout_payment_orders_payment_order"
          UNIQUE ("checkout_payment_id", "sales_order_id"),
        CONSTRAINT "FK_checkout_payment_orders_payment"
          FOREIGN KEY ("checkout_payment_id")
          REFERENCES "checkout_payments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_checkout_payment_orders_sales_order"
          FOREIGN KEY ("sales_order_id")
          REFERENCES "sales_orders"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payment_orders_payment_id"
        ON "checkout_payment_orders" ("checkout_payment_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payment_orders_sales_order_id"
        ON "checkout_payment_orders" ("sales_order_id")
    `);

    // 2. Migrate existing data: copy all non-null sales_order_id rows into join table
    //    All existing rows are is_primary=true (they were the only linked order)
    await queryRunner.query(`
      INSERT INTO "checkout_payment_orders" ("checkout_payment_id", "sales_order_id", "is_primary")
      SELECT "id", "sales_order_id", true
      FROM "checkout_payments"
      WHERE "sales_order_id" IS NOT NULL
      ON CONFLICT ("checkout_payment_id", "sales_order_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "checkout_payment_orders" CASCADE`,
    );
  }
}
