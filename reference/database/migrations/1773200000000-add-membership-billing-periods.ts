import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembershipBillingPeriods1773200000000
  implements MigrationInterface
{
  name = 'AddMembershipBillingPeriods1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create membership_billing_periods lookup table
    //    Holds period definitions only (duration info). No pricing here.
    //    Pricing lives entirely in membership_plan_billing_periods as a catalog.
    await queryRunner.query(`
      CREATE TABLE "membership_billing_periods" (
        "id" SERIAL NOT NULL,
        "period_code" character varying(50) NOT NULL,
        "period_name" character varying(100) NOT NULL,
        "duration_in_months" integer NOT NULL,
        "duration_in_days" integer NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_membership_billing_periods_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_membership_billing_periods_period_code" ON "membership_billing_periods" ("period_code") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_billing_periods_is_active" ON "membership_billing_periods" ("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_billing_periods_sort_order" ON "membership_billing_periods" ("sort_order")
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_billing_periods" ADD CONSTRAINT "FK_membership_billing_periods_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_billing_periods" ADD CONSTRAINT "FK_membership_billing_periods_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_billing_periods" ADD CONSTRAINT "FK_membership_billing_periods_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // 2. Seed default billing period definitions (duration info only, no pricing)
    await queryRunner.query(`
      INSERT INTO "membership_billing_periods" ("period_code", "period_name", "duration_in_months", "duration_in_days", "sort_order", "is_active")
      VALUES
        ('monthly',     '1 Month',   1,  30,  1, true),
        ('quarterly',   '3 Months',  3,  90,  2, true),
        ('semi_annual', '6 Months',  6,  180, 3, true),
        ('annual',      '12 Months', 12, 365, 4, true)
    `);

    // 3. Create membership_plan_billing_periods — the pricing catalog.
    //    Every plan+period combination is an independent product entry with its own
    //    total_price and discount_percentage. No "base" price concept — each row is authoritative.
    await queryRunner.query(`
      CREATE TABLE "membership_plan_billing_periods" (
        "id" SERIAL NOT NULL,
        "membership_plan_id" integer NOT NULL,
        "billing_period_id" integer NOT NULL,
        "total_price" numeric(12,2) NOT NULL,
        "discount_percentage" numeric(5,2) NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_membership_plan_billing_periods_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_membership_plan_billing_periods_plan_period" ON "membership_plan_billing_periods" ("membership_plan_id", "billing_period_id") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plan_billing_periods_membership_plan_id" ON "membership_plan_billing_periods" ("membership_plan_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plan_billing_periods_billing_period_id" ON "membership_plan_billing_periods" ("billing_period_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plan_billing_periods_is_active" ON "membership_plan_billing_periods" ("is_active")
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" ADD CONSTRAINT "FK_membership_plan_billing_periods_membership_plan_id" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" ADD CONSTRAINT "FK_membership_plan_billing_periods_billing_period_id" FOREIGN KEY ("billing_period_id") REFERENCES "membership_billing_periods"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" ADD CONSTRAINT "FK_membership_plan_billing_periods_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" ADD CONSTRAINT "FK_membership_plan_billing_periods_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" ADD CONSTRAINT "FK_membership_plan_billing_periods_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // 4. Seed: all active plans × all billing periods with computed total_price.
    //    Default discounts: monthly=0%, quarterly=5%, semi_annual=10%, annual=20%.
    //    total_price = plan.price × duration_in_months × (1 - discount / 100), rounded to 2dp.
    //    Admin can update these values freely after migration.
    await queryRunner.query(`
      INSERT INTO "membership_plan_billing_periods" ("membership_plan_id", "billing_period_id", "total_price", "discount_percentage", "is_active")
      SELECT
        mp.id,
        mbp.id,
        ROUND(
          mp.price * mbp.duration_in_months * (
            1 - CASE mbp.period_code
              WHEN 'monthly'     THEN 0.00
              WHEN 'quarterly'   THEN 0.05
              WHEN 'semi_annual' THEN 0.10
              WHEN 'annual'      THEN 0.20
              ELSE 0.00
            END
          ), 2
        ),
        CASE mbp.period_code
          WHEN 'monthly'     THEN 0
          WHEN 'quarterly'   THEN 5
          WHEN 'semi_annual' THEN 10
          WHEN 'annual'      THEN 20
          ELSE 0
        END,
        true
      FROM "membership_plans" mp
      CROSS JOIN "membership_billing_periods" mbp
      WHERE mp.deleted_at IS NULL AND mbp.deleted_at IS NULL
    `);

    // 4b. Drop price from membership_plans — pricing now lives entirely in membership_plan_billing_periods
    await queryRunner.query(`
      ALTER TABLE "membership_plans" DROP COLUMN "price"
    `);

    // 4c. Drop currency from membership_plans and add description (text)
    await queryRunner.query(`
      ALTER TABLE "membership_plans" DROP COLUMN "currency"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plans" ADD COLUMN "description" text
    `);

    // 5. Remove billing_cycle column and index from membership_plans
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_membership_plans_billing_cycle"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plans" DROP COLUMN "billing_cycle"
    `);

    // 6. Add membership_plan_billing_period_id to memberships
    await queryRunner.query(`
      ALTER TABLE "memberships" ADD COLUMN "membership_plan_billing_period_id" integer
    `);
    await queryRunner.query(`
      UPDATE "memberships" m SET "membership_plan_billing_period_id" = (
        SELECT mpbp.id FROM "membership_plan_billing_periods" mpbp
        JOIN "membership_billing_periods" mbp ON mbp.id = mpbp.billing_period_id
        WHERE mpbp.membership_plan_id = m.membership_plan_id
        AND mbp.period_code = 'monthly'
        LIMIT 1
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "memberships" ALTER COLUMN "membership_plan_billing_period_id" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_memberships_membership_plan_billing_period_id" ON "memberships" ("membership_plan_billing_period_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_membership_plan_billing_period_id" FOREIGN KEY ("membership_plan_billing_period_id") REFERENCES "membership_plan_billing_periods"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    // Drop old billing_cycle column and index from memberships
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_memberships_billing_cycle"
    `);
    await queryRunner.query(`
      ALTER TABLE "memberships" DROP COLUMN "billing_cycle"
    `);

    // 7. Add membership_plan_billing_period_id + snapshot columns to membership_payments
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ADD COLUMN "membership_plan_billing_period_id" integer
    `);
    await queryRunner.query(`
      UPDATE "membership_payments" mp SET "membership_plan_billing_period_id" = (
        SELECT mpbp.id FROM "membership_plan_billing_periods" mpbp
        JOIN "membership_billing_periods" mbp ON mbp.id = mpbp.billing_period_id
        WHERE mpbp.membership_plan_id = mp.membership_plan_id
        AND mbp.period_code = 'monthly'
        LIMIT 1
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ALTER COLUMN "membership_plan_billing_period_id" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_payments_membership_plan_billing_period_id" ON "membership_payments" ("membership_plan_billing_period_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ADD CONSTRAINT "FK_membership_payments_membership_plan_billing_period_id" FOREIGN KEY ("membership_plan_billing_period_id") REFERENCES "membership_plan_billing_periods"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Add snapshot columns
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ADD COLUMN "billing_period_code" character varying(50)
    `);
    await queryRunner.query(`
      UPDATE "membership_payments" SET "billing_period_code" = LOWER("billing_cycle")
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ALTER COLUMN "billing_period_code" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "membership_payments" ADD COLUMN "billing_duration_months" integer
    `);
    await queryRunner.query(`
      UPDATE "membership_payments" SET "billing_duration_months" = CASE
        WHEN UPPER("billing_cycle") = 'ANNUAL' THEN 12
        ELSE 1
      END
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ALTER COLUMN "billing_duration_months" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "membership_payments" ADD COLUMN "base_monthly_price" numeric(12,2)
    `);
    await queryRunner.query(`
      UPDATE "membership_payments" SET "base_monthly_price" = "amount"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ALTER COLUMN "base_monthly_price" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "membership_payments" ADD COLUMN "discount_percentage" numeric(5,2) NOT NULL DEFAULT 0
    `);

    // Drop old billing_cycle column from membership_payments
    await queryRunner.query(`
      ALTER TABLE "membership_payments" DROP COLUMN "billing_cycle"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Re-add billing_cycle to membership_payments
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ADD COLUMN "billing_cycle" character varying(20)
    `);
    await queryRunner.query(`
      UPDATE "membership_payments" SET "billing_cycle" = UPPER("billing_period_code")
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" ALTER COLUMN "billing_cycle" SET NOT NULL
    `);

    // Drop snapshot columns from membership_payments
    await queryRunner.query(`
      ALTER TABLE "membership_payments" DROP COLUMN "discount_percentage"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" DROP COLUMN "base_monthly_price"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" DROP COLUMN "billing_duration_months"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" DROP COLUMN "billing_period_code"
    `);

    // Drop membership_plan_billing_period_id FK and column from membership_payments
    await queryRunner.query(`
      ALTER TABLE "membership_payments" DROP CONSTRAINT "FK_membership_payments_membership_plan_billing_period_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_membership_payments_membership_plan_billing_period_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_payments" DROP COLUMN "membership_plan_billing_period_id"
    `);

    // 2. Re-add billing_cycle to memberships
    await queryRunner.query(`
      ALTER TABLE "memberships" ADD COLUMN "billing_cycle" character varying(20)
    `);
    await queryRunner.query(`
      UPDATE "memberships" SET "billing_cycle" = 'MONTHLY'
    `);
    await queryRunner.query(`
      ALTER TABLE "memberships" ALTER COLUMN "billing_cycle" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_memberships_billing_cycle" ON "memberships" ("billing_cycle")
    `);

    // Drop membership_plan_billing_period_id FK and column from memberships
    await queryRunner.query(`
      ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_membership_plan_billing_period_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_memberships_membership_plan_billing_period_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "memberships" DROP COLUMN "membership_plan_billing_period_id"
    `);

    // 3. Re-add billing_cycle and price to membership_plans; restore currency, drop description
    await queryRunner.query(`
      ALTER TABLE "membership_plans" DROP COLUMN "description"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plans" ADD COLUMN "currency" character varying(10) NOT NULL DEFAULT 'PHP'
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plans" ADD COLUMN "billing_cycle" character varying NOT NULL DEFAULT 'MONTHLY'
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plans_billing_cycle" ON "membership_plans" ("billing_cycle")
    `);
    // Restore price from the monthly billing period entry (1-month total_price = base monthly price)
    await queryRunner.query(`
      ALTER TABLE "membership_plans" ADD COLUMN "price" numeric(12,2)
    `);
    await queryRunner.query(`
      UPDATE "membership_plans" mp SET "price" = (
        SELECT mpbp.total_price
        FROM "membership_plan_billing_periods" mpbp
        JOIN "membership_billing_periods" mbp ON mbp.id = mpbp.billing_period_id
        WHERE mpbp.membership_plan_id = mp.id
          AND mbp.period_code = 'monthly'
          AND mpbp.deleted_at IS NULL
        LIMIT 1
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plans" ALTER COLUMN "price" SET NOT NULL
    `);

    // 4. Drop membership_plan_billing_periods table
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" DROP CONSTRAINT "FK_membership_plan_billing_periods_membership_plan_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" DROP CONSTRAINT "FK_membership_plan_billing_periods_billing_period_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" DROP CONSTRAINT "FK_membership_plan_billing_periods_created_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" DROP CONSTRAINT "FK_membership_plan_billing_periods_updated_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plan_billing_periods" DROP CONSTRAINT "FK_membership_plan_billing_periods_deleted_by"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_membership_plan_billing_periods_is_active"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_membership_plan_billing_periods_billing_period_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_membership_plan_billing_periods_membership_plan_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."UQ_membership_plan_billing_periods_plan_period"
    `);
    await queryRunner.query(`DROP TABLE "membership_plan_billing_periods"`);

    // 5. Drop membership_billing_periods table
    await queryRunner.query(`
      ALTER TABLE "membership_billing_periods" DROP CONSTRAINT "FK_membership_billing_periods_created_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_billing_periods" DROP CONSTRAINT "FK_membership_billing_periods_updated_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_billing_periods" DROP CONSTRAINT "FK_membership_billing_periods_deleted_by"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_membership_billing_periods_sort_order"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_membership_billing_periods_is_active"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."UQ_membership_billing_periods_period_code"
    `);
    await queryRunner.query(`DROP TABLE "membership_billing_periods"`);
  }
}
