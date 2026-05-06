import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create seller_earnings, seller_payouts, and seller_payout_accounts tables.
 *
 * This migration creates tables for tracking seller earnings from bookings/sales,
 * managing payout requests, and storing payout account information.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateSellerEarningsPayoutsTables1765480000000
  implements MigrationInterface
{
  name = 'CreateSellerEarningsPayoutsTables1765480000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for payout account type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payout_account_type_enum" AS ENUM(
          'bank_transfer',
          'gcash',
          'maya',
          'paypal'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create seller_earnings table
    await queryRunner.query(`
      CREATE TABLE "seller_earnings" (
        "id" SERIAL PRIMARY KEY,
        "seller_id" integer NOT NULL,
        
        -- Source tracking
        "source_type" varchar(20) NOT NULL,
        -- booking, sales_order
        "source_id" integer NOT NULL,
        
        -- For bookings, can be per milestone
        "milestone_id" integer,
        
        -- Amounts
        "gross_amount" numeric(12,2) NOT NULL,
        "platform_fee" numeric(10,2) NOT NULL DEFAULT 0,
        "net_amount" numeric(12,2) NOT NULL,
        "currency_id" integer,
        
        -- Status
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        -- pending, available, processing, paid, held
        
        -- Availability
        "available_at" TIMESTAMP WITH TIME ZONE,
        
        -- Audit Fields (BaseEntityHelper)
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT "FK_seller_earnings_seller_id"
          FOREIGN KEY ("seller_id")
          REFERENCES "sellers"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_earnings_milestone_id"
          FOREIGN KEY ("milestone_id")
          REFERENCES "booking_milestones"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_earnings_currency_id"
          FOREIGN KEY ("currency_id")
          REFERENCES "currencies"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_earnings_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_earnings_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_earnings_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Create indexes for seller_earnings
    await queryRunner.query(`
      CREATE INDEX "IDX_seller_earnings_seller_id" ON "seller_earnings"("seller_id");
      CREATE INDEX "IDX_seller_earnings_status" ON "seller_earnings"("status");
      CREATE INDEX "IDX_seller_earnings_source_type" ON "seller_earnings"("source_type");
      CREATE INDEX "IDX_seller_earnings_available_at" ON "seller_earnings"("available_at");
      CREATE INDEX "IDX_seller_earnings_deleted_at" ON "seller_earnings"("deleted_at");
    `);

    // Create seller_payout_accounts table
    await queryRunner.query(`
      CREATE TABLE "seller_payout_accounts" (
        "id" SERIAL PRIMARY KEY,
        "seller_id" integer NOT NULL,
        
        -- Account Type
        "account_type" "payout_account_type_enum" NOT NULL,
        
        -- Account Details
        "account_name" varchar(255) NOT NULL,
        "account_number" varchar(100) NOT NULL,
        
        -- For bank accounts
        "bank_name" varchar(100),
        "bank_code" varchar(20),
        "bank_branch" varchar(100),
        "swift_code" varchar(20),
        
        -- For e-wallets
        "mobile_number" varchar(20),
        
        -- Settings
        "is_default" boolean NOT NULL DEFAULT false,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verified_at" TIMESTAMP WITH TIME ZONE,
        
        -- Status
        "status" varchar(20) NOT NULL DEFAULT 'active',
        -- active, inactive, suspended
        
        -- Audit Fields (BaseEntityHelper)
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT "FK_seller_payout_accounts_seller_id"
          FOREIGN KEY ("seller_id")
          REFERENCES "sellers"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payout_accounts_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payout_accounts_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payout_accounts_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Create indexes for seller_payout_accounts
    await queryRunner.query(`
      CREATE INDEX "IDX_seller_payout_accounts_seller_id" ON "seller_payout_accounts"("seller_id");
      CREATE INDEX "IDX_seller_payout_accounts_is_default" ON "seller_payout_accounts"("is_default");
      CREATE INDEX "IDX_seller_payout_accounts_status" ON "seller_payout_accounts"("status");
      CREATE INDEX "IDX_seller_payout_accounts_deleted_at" ON "seller_payout_accounts"("deleted_at");
    `);

    // Create seller_payouts table
    await queryRunner.query(`
      CREATE TABLE "seller_payouts" (
        "id" SERIAL PRIMARY KEY,
        "seller_id" integer NOT NULL,
        
        -- Payout Reference
        "payout_number" varchar(50) UNIQUE NOT NULL,
        
        -- Amount
        "amount" numeric(12,2) NOT NULL,
        "currency_id" integer,
        
        -- Payout Method
        "payout_method" varchar(50) NOT NULL,
        -- bank_transfer, gcash, maya, paypal
        
        -- Bank Details (denormalized for historical record)
        "bank_name" varchar(100),
        "account_number" varchar(50),
        "account_name" varchar(255),
        
        -- Status
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        -- pending, processing, completed, failed, cancelled
        
        -- Processing
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "failure_reason" text,
        
        -- Audit Fields (BaseEntityHelper)
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT "FK_seller_payouts_seller_id"
          FOREIGN KEY ("seller_id")
          REFERENCES "sellers"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payouts_currency_id"
          FOREIGN KEY ("currency_id")
          REFERENCES "currencies"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payouts_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payouts_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payouts_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Create indexes for seller_payouts
    await queryRunner.query(`
      CREATE INDEX "IDX_seller_payouts_seller_id" ON "seller_payouts"("seller_id");
      CREATE INDEX "IDX_seller_payouts_status" ON "seller_payouts"("status");
      CREATE INDEX "IDX_seller_payouts_payout_number" ON "seller_payouts"("payout_number");
      CREATE INDEX "IDX_seller_payouts_deleted_at" ON "seller_payouts"("deleted_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_seller_payouts_deleted_at";
      DROP INDEX IF EXISTS "IDX_seller_payouts_payout_number";
      DROP INDEX IF EXISTS "IDX_seller_payouts_status";
      DROP INDEX IF EXISTS "IDX_seller_payouts_seller_id";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_seller_payout_accounts_deleted_at";
      DROP INDEX IF EXISTS "IDX_seller_payout_accounts_status";
      DROP INDEX IF EXISTS "IDX_seller_payout_accounts_is_default";
      DROP INDEX IF EXISTS "IDX_seller_payout_accounts_seller_id";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_seller_earnings_deleted_at";
      DROP INDEX IF EXISTS "IDX_seller_earnings_available_at";
      DROP INDEX IF EXISTS "IDX_seller_earnings_source_type";
      DROP INDEX IF EXISTS "IDX_seller_earnings_status";
      DROP INDEX IF EXISTS "IDX_seller_earnings_seller_id";
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_payouts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_payout_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_earnings"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "payout_account_type_enum"`);
  }
}
