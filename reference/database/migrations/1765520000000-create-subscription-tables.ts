import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionTables1765520000000
  implements MigrationInterface
{
  name = 'CreateSubscriptionTables1765520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create plan_type enum
    await queryRunner.query(`
      CREATE TYPE "plan_type_enum" AS ENUM ('ekumpra', 'travajo', 'unified')
    `);

    // Create billing_cycle enum
    await queryRunner.query(`
      CREATE TYPE "billing_cycle_enum" AS ENUM ('monthly', 'quarterly', 'yearly')
    `);

    // Create plan_status enum
    await queryRunner.query(`
      CREATE TYPE "plan_status_enum" AS ENUM ('active', 'inactive', 'deprecated')
    `);

    // Create subscription_status enum
    await queryRunner.query(`
      CREATE TYPE "subscription_status_enum" AS ENUM ('active', 'cancelled', 'expired', 'suspended', 'pending_payment')
    `);

    // Create subscription_payment_status enum
    await queryRunner.query(`
      CREATE TYPE "subscription_payment_status_enum" AS ENUM ('pending', 'paid', 'failed', 'refunded')
    `);

    // Create subscription_plans table
    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id" SERIAL PRIMARY KEY,
        "plan_name" VARCHAR(100) NOT NULL,
        "plan_code" VARCHAR(50) NOT NULL UNIQUE,
        "description" TEXT,
        "plan_type" "plan_type_enum" NOT NULL DEFAULT 'unified',
        "price" DECIMAL(12, 2) NOT NULL,
        "currency_id" INTEGER REFERENCES "currencies"("id"),
        "billing_cycle" "billing_cycle_enum" NOT NULL DEFAULT 'monthly',
        "features" JSONB DEFAULT '[]',
        "max_sellers" INTEGER NOT NULL DEFAULT 1,
        "max_products" INTEGER,
        "max_services" INTEGER,
        "max_members" INTEGER,
        "commission_percent" DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
        "display_order" INTEGER NOT NULL DEFAULT 0,
        "status" "plan_status_enum" NOT NULL DEFAULT 'active',
        "created_by" INTEGER REFERENCES "user"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" INTEGER REFERENCES "user"("id"),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" INTEGER REFERENCES "user"("id"),
        "deleted_at" TIMESTAMP
      )
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "user"("id"),
        "plan_id" INTEGER NOT NULL REFERENCES "subscription_plans"("id"),
        "subscription_number" VARCHAR(50) NOT NULL UNIQUE,
        "status" "subscription_status_enum" NOT NULL DEFAULT 'pending_payment',
        "start_date" DATE NOT NULL,
        "end_date" DATE,
        "next_billing_date" DATE,
        "auto_renew" BOOLEAN NOT NULL DEFAULT true,
        "cancelled_at" TIMESTAMP,
        "cancelled_by" INTEGER REFERENCES "user"("id"),
        "cancellation_reason" TEXT,
        "created_by" INTEGER REFERENCES "user"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" INTEGER REFERENCES "user"("id"),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" INTEGER REFERENCES "user"("id"),
        "deleted_at" TIMESTAMP
      )
    `);

    // Create subscription_payments table
    await queryRunner.query(`
      CREATE TABLE "subscription_payments" (
        "id" SERIAL PRIMARY KEY,
        "subscription_id" INTEGER NOT NULL REFERENCES "subscriptions"("id"),
        "payment_number" VARCHAR(50) NOT NULL UNIQUE,
        "amount" DECIMAL(12, 2) NOT NULL,
        "payment_status" "subscription_payment_status_enum" NOT NULL DEFAULT 'pending',
        "transaction_id" VARCHAR(255),
        "payment_method" VARCHAR(50),
        "billing_cycle_start" DATE NOT NULL,
        "billing_cycle_end" DATE NOT NULL,
        "due_date" DATE NOT NULL,
        "paid_at" TIMESTAMP,
        "created_by" INTEGER REFERENCES "user"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" INTEGER REFERENCES "user"("id"),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" INTEGER REFERENCES "user"("id"),
        "deleted_at" TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_subscription_plans_status" ON "subscription_plans" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_subscription_plans_plan_type" ON "subscription_plans" ("plan_type")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_plan_id" ON "subscriptions" ("plan_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_status" ON "subscriptions" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_subscription_payments_subscription_id" ON "subscription_payments" ("subscription_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_subscription_payments_status" ON "subscription_payments" ("payment_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subscription_payments_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subscription_payments_subscription_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_subscriptions_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_subscriptions_user_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subscription_plans_plan_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subscription_plans_status"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans"`);

    // Drop enums
    await queryRunner.query(
      `DROP TYPE IF EXISTS "subscription_payment_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "billing_cycle_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_type_enum"`);
  }
}
