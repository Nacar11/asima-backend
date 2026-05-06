import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create checkout_payments table.
 *
 * This migration creates the checkout_payments table for payment processing
 * of checkout orders. Tracks payment status, gateway details, amounts, and
 * refund information.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateCheckoutPaymentsTable1765460000000
  implements MigrationInterface
{
  name = 'CreateCheckoutPaymentsTable1765460000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "checkout_payment_status_enum" AS ENUM(
          'pending',
          'awaiting_payment',
          'processing',
          'completed',
          'failed',
          'cancelled',
          'expired',
          'partially_refunded',
          'fully_refunded',
          'chargeback'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create checkout_payments table
    await queryRunner.query(`
      CREATE TABLE "checkout_payments" (
        "id" SERIAL PRIMARY KEY,
        "checkout_order_id" integer NOT NULL,
        
        -- Transaction Reference
        "transaction_number" varchar(50) UNIQUE,
        -- Format: PAY-YYYYMMDD-XXXX
        
        -- Payment Method
        "payment_method_code" varchar(30) NOT NULL,
        -- gcash, credit_card, cod - determined by PayMongo
        "payment_gateway" varchar(50) NOT NULL DEFAULT 'paymongo',
        
        -- Gateway Details (PayMongo)
        "gateway_transaction_id" varchar(100),
        "gateway_reference_number" varchar(100),
        "gateway_checkout_url" varchar(500),
        -- For redirect-based payments (GCash)
        "gateway_response" jsonb,
        
        -- Payment Type
        "payment_type" varchar(20) NOT NULL DEFAULT 'full',
        -- full, partial, installment
        "installment_id" integer,
        -- Links to installment if this is an installment payment
        
        -- Amount
        "amount" numeric(12,2) NOT NULL,
        "gateway_fee" numeric(10,2) NOT NULL DEFAULT 0,
        -- Gateway processing fee
        "net_amount" numeric(12,2),
        -- Amount after gateway fees
        "currency_id" integer,
        
        -- Status
        "status" "checkout_payment_status_enum" NOT NULL DEFAULT 'pending',
        "failure_reason" text,
        "failure_code" varchar(50),
        
        -- Timestamps
        "initiated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "paid_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        -- For pending payments that expire
        
        -- Refund Tracking (aggregated from refunds table)
        "total_refunded" numeric(12,2) NOT NULL DEFAULT 0,
        "refund_count" integer NOT NULL DEFAULT 0,
        "last_refund_at" TIMESTAMP WITH TIME ZONE,
        "is_fully_refunded" boolean NOT NULL DEFAULT false,
        
        -- Chargeback
        "chargeback_at" TIMESTAMP WITH TIME ZONE,
        "chargeback_reason" text,
        "chargeback_amount" numeric(12,2),
        
        -- Audit Fields
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        
        CONSTRAINT "FK_checkout_payments_checkout_order_id"
          FOREIGN KEY ("checkout_order_id")
          REFERENCES "checkout_orders"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_payments_currency_id"
          FOREIGN KEY ("currency_id")
          REFERENCES "currencies"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_payments_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_payments_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payments_checkout_order_id" 
        ON "checkout_payments"("checkout_order_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payments_transaction_number" 
        ON "checkout_payments"("transaction_number");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payments_status" 
        ON "checkout_payments"("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payments_gateway_transaction_id" 
        ON "checkout_payments"("gateway_transaction_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payments_payment_method_code" 
        ON "checkout_payments"("payment_method_code");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payments_payment_type" 
        ON "checkout_payments"("payment_type");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payments_paid_at" 
        ON "checkout_payments"("paid_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_payments_paid_at";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_payments_payment_type";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_payments_payment_method_code";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_payments_gateway_transaction_id";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_payments_status";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_payments_transaction_number";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_payments_checkout_order_id";
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "checkout_payments";`);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "checkout_payment_status_enum";
    `);
  }
}
