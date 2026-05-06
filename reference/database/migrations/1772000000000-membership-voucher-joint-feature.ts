import { MigrationInterface, QueryRunner } from 'typeorm';

export class MembershipVoucherJointFeature1772000000000
  implements MigrationInterface
{
  name = 'MembershipVoucherJointFeature1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "membership_plans" (
        "id" SERIAL NOT NULL,
        "plan_code" character varying NOT NULL,
        "plan_name" character varying NOT NULL,
        "billing_cycle" character varying NOT NULL,
        "price" numeric NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'PHP',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_membership_plans_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_membership_plans_plan_code" ON "membership_plans" ("plan_code")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plans_billing_cycle" ON "membership_plans" ("billing_cycle")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plans_is_active" ON "membership_plans" ("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plans_created_by" ON "membership_plans" ("created_by")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plans_updated_by" ON "membership_plans" ("updated_by")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_membership_plans_deleted_by" ON "membership_plans" ("deleted_by")
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plans" ADD CONSTRAINT "FK_membership_plans_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plans" ADD CONSTRAINT "FK_membership_plans_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_plans" ADD CONSTRAINT "FK_membership_plans_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_memberships_user_id_active_or_grace"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."memberships_status_enum" RENAME TO "memberships_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."memberships_status_enum" AS ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(`
      ALTER TABLE "memberships"
      ALTER COLUMN "status" TYPE "public"."memberships_status_enum"
      USING "status"::text::"public"."memberships_status_enum"
    `);
    await queryRunner.query(`DROP TYPE "public"."memberships_status_enum_old"`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_memberships_user_id_active_or_grace" ON "memberships" ("user_id") WHERE "deleted_at" IS NULL AND "status" IN ('ACTIVE')`,
    );

    await queryRunner.query(
      `ALTER TABLE "memberships" ALTER COLUMN "billing_cycle" TYPE character varying USING "billing_cycle"::text`,
    );

    await queryRunner.query(
      `ALTER TABLE "memberships" ADD COLUMN "membership_plan_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_membership_plan_id" ON "memberships" ("membership_plan_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_membership_plan_id" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."membership_payments_payment_status_enum" RENAME TO "membership_payments_payment_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_payments_payment_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED')`,
    );
    await queryRunner.query(`
      ALTER TABLE "membership_payments"
      ALTER COLUMN "payment_status" TYPE "public"."membership_payments_payment_status_enum"
      USING "payment_status"::text::"public"."membership_payments_payment_status_enum"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."membership_payments_payment_status_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN "failure_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN "attempt_number"`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_payments" ALTER COLUMN "billing_cycle" TYPE character varying USING "billing_cycle"::text`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_payments_billing_cycle_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN "membership_plan_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN "membership_plan_code" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN "membership_plan_name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN "provider" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN IF NOT EXISTS "gateway_reference_number" character varying(100)`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_membership_payments_membership_plan_id" ON "membership_payments" ("membership_plan_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD CONSTRAINT "FK_membership_payments_membership_plan_id" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD COLUMN "membership_plan_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_configurations_membership_plan_id" ON "membership_voucher_configurations" ("membership_plan_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD CONSTRAINT "FK_membership_voucher_configurations_membership_plan_id" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP CONSTRAINT "FK_membership_voucher_configurations_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP COLUMN "event_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP COLUMN "billing_cycle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" RENAME COLUMN "is_enabled" TO "is_active"`,
    );

    await queryRunner.query(
      `DROP TYPE "public"."memberships_billing_cycle_enum"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_membership_voucher_configurations_event_billing_voucher"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_membership_voucher_configurations_membership_plan_id_voucher_id" ON "membership_voucher_configurations" ("membership_plan_id", "voucher_id") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD CONSTRAINT "FK_membership_voucher_configurations_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP CONSTRAINT "UQ_membership_voucher_grants_membership_voucher_grant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP COLUMN "grant_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP COLUMN "granted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP COLUMN "quantity"`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD COLUMN "voucher_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ALTER COLUMN "membership_payment_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_grants_voucher_id" ON "membership_voucher_grants" ("voucher_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_grants_membership_payment_id" ON "membership_voucher_grants" ("membership_payment_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD CONSTRAINT "FK_membership_voucher_grants_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `DROP TYPE "public"."membership_voucher_configurations_event_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_voucher_grants_grant_type_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_memberships_user_id_active_or_grace"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_voucher_grants_grant_type_enum" AS ENUM('WELCOME', 'RENEWAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_voucher_configurations_event_type_enum" AS ENUM('WELCOME', 'RENEWAL')`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP CONSTRAINT "FK_membership_voucher_grants_voucher_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_grants_membership_payment_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_grants_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ALTER COLUMN "membership_payment_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP COLUMN "voucher_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD COLUMN "quantity" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD COLUMN "granted_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD COLUMN "grant_type" "public"."membership_voucher_grants_grant_type_enum" NOT NULL DEFAULT 'WELCOME'`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD CONSTRAINT "UQ_membership_voucher_grants_membership_voucher_grant" UNIQUE ("membership_id", "voucher_code", "grant_type")`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP CONSTRAINT "FK_membership_voucher_configurations_voucher_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_membership_voucher_configurations_membership_plan_id_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" RENAME COLUMN "is_active" TO "is_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD COLUMN "billing_cycle" "public"."memberships_billing_cycle_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD COLUMN "event_type" "public"."membership_voucher_configurations_event_type_enum" NOT NULL DEFAULT 'WELCOME'`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP CONSTRAINT "FK_membership_voucher_configurations_membership_plan_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_configurations_membership_plan_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP COLUMN "membership_plan_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP CONSTRAINT "FK_membership_payments_membership_plan_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_payments_membership_plan_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN "provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN "membership_plan_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN "membership_plan_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN "membership_plan_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN IF EXISTS "gateway_reference_number"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."membership_payments_billing_cycle_enum" AS ENUM('MONTHLY', 'ANNUAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ALTER COLUMN "billing_cycle" TYPE "public"."membership_payments_billing_cycle_enum" USING "billing_cycle"::"public"."membership_payments_billing_cycle_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN "attempt_number" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN "failure_reason" character varying(255)`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."membership_payments_payment_status_enum" RENAME TO "membership_payments_payment_status_enum_new"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."membership_payments_payment_status_enum_old" RENAME TO "membership_payments_payment_status_enum"`,
    );
    await queryRunner.query(`
      ALTER TABLE "membership_payments"
      ALTER COLUMN "payment_status" TYPE "public"."membership_payments_payment_status_enum"
      USING "payment_status"::text::"public"."membership_payments_payment_status_enum"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."membership_payments_payment_status_enum_new"`,
    );

    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_membership_plan_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_memberships_membership_plan_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP COLUMN "membership_plan_id"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."memberships_billing_cycle_enum" AS ENUM('MONTHLY', 'ANNUAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ALTER COLUMN "billing_cycle" TYPE "public"."memberships_billing_cycle_enum" USING "billing_cycle"::"public"."memberships_billing_cycle_enum"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."memberships_status_enum" RENAME TO "memberships_status_enum_new"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."memberships_status_enum_old" RENAME TO "memberships_status_enum"`,
    );
    await queryRunner.query(`
      ALTER TABLE "memberships"
      ALTER COLUMN "status" TYPE "public"."memberships_status_enum"
      USING "status"::text::"public"."memberships_status_enum"
    `);
    await queryRunner.query(`DROP TYPE "public"."memberships_status_enum_new"`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_memberships_user_id_active_or_grace" ON "memberships" ("user_id") WHERE "deleted_at" IS NULL AND "status" IN ('ACTIVE', 'GRACE_PERIOD')`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_plans_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_plans_billing_cycle"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_membership_plans_plan_code"`,
    );
    await queryRunner.query(`DROP TABLE "membership_plans"`);
  }
}
