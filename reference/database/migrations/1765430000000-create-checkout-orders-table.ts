import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create checkout_orders table.
 *
 * This migration creates the checkout_orders table for unified checkout
 * that can contain both products and services. The table tracks order
 * status, payment status, totals, and addresses for delivery/service.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateCheckoutOrdersTable1765430000000
  implements MigrationInterface
{
  name = 'CreateCheckoutOrdersTable1765430000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "checkout_status_enum" AS ENUM(
          'pending',
          'confirmed',
          'processing',
          'partial_fulfilled',
          'completed',
          'cancelled',
          'refunded'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM(
          'pending',
          'processing',
          'paid',
          'partial',
          'failed',
          'refunded'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create checkout_orders table
    await queryRunner.query(`
      CREATE TABLE "checkout_orders" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "order_number" varchar(50) NOT NULL UNIQUE,
        
        -- Order Contents
        "has_products" boolean NOT NULL DEFAULT false,
        "has_services" boolean NOT NULL DEFAULT false,
        "has_bundles" boolean NOT NULL DEFAULT false,
        
        -- Totals
        "subtotal" numeric(12,2) NOT NULL,
        "discount_total" numeric(10,2) NOT NULL DEFAULT 0,
        "shipping_total" numeric(10,2) NOT NULL DEFAULT 0,
        "tax_total" numeric(10,2) NOT NULL DEFAULT 0,
        "platform_fee_total" numeric(10,2) NOT NULL DEFAULT 0,
        "grand_total" numeric(12,2) NOT NULL,
        "currency_id" integer,
        
        -- Status
        "status" "checkout_status_enum" NOT NULL DEFAULT 'pending',
        "payment_status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        
        -- Delivery Address (for products)
        "delivery_address_id" integer,
        
        -- Service Address (for services)
        "service_address_id" integer,
        
        -- Notes
        "customer_notes" text,
        "internal_notes" text,
        
        -- Timestamps
        "paid_at" timestamp,
        "completed_at" timestamp,
        "cancelled_at" timestamp,
        "cancellation_reason" text,
        
        -- Source
        "source" varchar(50) NOT NULL DEFAULT 'mobile_app',
        
        -- Audit Fields
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT "FK_checkout_orders_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_orders_currency_id"
          FOREIGN KEY ("currency_id")
          REFERENCES "currencies"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_orders_delivery_address_id"
          FOREIGN KEY ("delivery_address_id")
          REFERENCES "user_addresses"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_orders_service_address_id"
          FOREIGN KEY ("service_address_id")
          REFERENCES "user_addresses"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_orders_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_orders_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_orders_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_orders_user_id"
      ON "checkout_orders" ("user_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_checkout_orders_order_number"
      ON "checkout_orders" ("order_number")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_orders_status"
      ON "checkout_orders" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_orders_payment_status"
      ON "checkout_orders" ("payment_status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_orders_created_at"
      ON "checkout_orders" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_orders_deleted_at"
      ON "checkout_orders" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_orders_deleted_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_orders_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_orders_payment_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_orders_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_orders_order_number"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_orders_user_id"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "checkout_orders"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "checkout_status_enum"`);
  }
}
