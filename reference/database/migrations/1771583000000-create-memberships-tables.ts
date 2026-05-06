import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMembershipsTables1771583000000
  implements MigrationInterface
{
  name = 'CreateMembershipsTables1771583000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."memberships_status_enum" AS ENUM('PENDING', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."memberships_billing_cycle_enum" AS ENUM('MONTHLY', 'ANNUAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_payments_billing_cycle_enum" AS ENUM('MONTHLY', 'ANNUAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_payments_payment_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_voucher_grants_grant_type_enum" AS ENUM('WELCOME', 'RENEWAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_voucher_configurations_event_type_enum" AS ENUM('WELCOME', 'RENEWAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "memberships" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "status" "public"."memberships_status_enum" NOT NULL, "billing_cycle" "public"."memberships_billing_cycle_enum" NOT NULL, "starts_at" TIMESTAMP, "ends_at" TIMESTAMP, "grace_ends_at" TIMESTAMP, "is_auto_renew_enabled" boolean NOT NULL DEFAULT true, "cancelled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" integer, "updated_by" integer, "deleted_by" integer, CONSTRAINT "PK_memberships_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_user_id" ON "memberships" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_memberships_user_id_active_or_grace" ON "memberships" ("user_id") WHERE "deleted_at" IS NULL AND "status" IN ('ACTIVE', 'GRACE_PERIOD')`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_status" ON "memberships" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_billing_cycle" ON "memberships" ("billing_cycle")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_ends_at" ON "memberships" ("ends_at")`,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_payments" ("id" SERIAL NOT NULL, "membership_id" integer NOT NULL, "user_id" integer NOT NULL, "billing_cycle" "public"."membership_payments_billing_cycle_enum" NOT NULL, "amount" numeric(12,2) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'PHP', "payment_status" "public"."membership_payments_payment_status_enum" NOT NULL, "provider_reference" character varying(100), "failure_reason" character varying(255), "attempt_number" integer, "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" integer, "updated_by" integer, "deleted_by" integer, CONSTRAINT "PK_membership_payments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_payments_membership_id" ON "membership_payments" ("membership_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_payments_user_id" ON "membership_payments" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_payments_payment_status" ON "membership_payments" ("payment_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_payments_paid_at" ON "membership_payments" ("paid_at")`,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_voucher_grants" ("id" SERIAL NOT NULL, "membership_id" integer NOT NULL, "user_id" integer NOT NULL, "membership_payment_id" integer, "voucher_code" character varying(100) NOT NULL, "quantity" integer NOT NULL DEFAULT 1, "grant_type" "public"."membership_voucher_grants_grant_type_enum" NOT NULL, "granted_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" integer, "updated_by" integer, "deleted_by" integer, CONSTRAINT "UQ_membership_voucher_grants_membership_voucher_grant" UNIQUE ("membership_id", "voucher_code", "grant_type"), CONSTRAINT "PK_membership_voucher_grants_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_grants_membership_id" ON "membership_voucher_grants" ("membership_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_grants_user_id" ON "membership_voucher_grants" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_grants_grant_type" ON "membership_voucher_grants" ("grant_type")`,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_voucher_configurations" ("id" SERIAL NOT NULL, "event_type" "public"."membership_voucher_configurations_event_type_enum" NOT NULL, "billing_cycle" "public"."memberships_billing_cycle_enum", "voucher_id" integer NOT NULL, "quantity" integer NOT NULL DEFAULT 1, "is_enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" integer, "updated_by" integer, "deleted_by" integer, CONSTRAINT "PK_membership_voucher_configurations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_configurations_event_type" ON "membership_voucher_configurations" ("event_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_configurations_billing_cycle" ON "membership_voucher_configurations" ("billing_cycle")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_voucher_configurations_voucher_id" ON "membership_voucher_configurations" ("voucher_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_membership_voucher_configurations_event_billing_voucher" ON "membership_voucher_configurations" ("event_type", "billing_cycle", "voucher_id") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD CONSTRAINT "FK_membership_payments_membership_id" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD CONSTRAINT "FK_membership_payments_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD CONSTRAINT "FK_membership_payments_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD CONSTRAINT "FK_membership_payments_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD CONSTRAINT "FK_membership_payments_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD CONSTRAINT "FK_membership_voucher_grants_membership_id" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD CONSTRAINT "FK_membership_voucher_grants_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD CONSTRAINT "FK_membership_voucher_grants_membership_payment_id" FOREIGN KEY ("membership_payment_id") REFERENCES "membership_payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD CONSTRAINT "FK_membership_voucher_grants_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD CONSTRAINT "FK_membership_voucher_grants_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" ADD CONSTRAINT "FK_membership_voucher_grants_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD CONSTRAINT "FK_membership_voucher_configurations_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD CONSTRAINT "FK_membership_voucher_configurations_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD CONSTRAINT "FK_membership_voucher_configurations_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" ADD CONSTRAINT "FK_membership_voucher_configurations_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP CONSTRAINT "FK_membership_voucher_configurations_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP CONSTRAINT "FK_membership_voucher_configurations_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP CONSTRAINT "FK_membership_voucher_configurations_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_configurations" DROP CONSTRAINT "FK_membership_voucher_configurations_voucher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP CONSTRAINT "FK_membership_voucher_grants_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP CONSTRAINT "FK_membership_voucher_grants_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP CONSTRAINT "FK_membership_voucher_grants_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP CONSTRAINT "FK_membership_voucher_grants_membership_payment_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP CONSTRAINT "FK_membership_voucher_grants_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_voucher_grants" DROP CONSTRAINT "FK_membership_voucher_grants_membership_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP CONSTRAINT "FK_membership_payments_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP CONSTRAINT "FK_membership_payments_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP CONSTRAINT "FK_membership_payments_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP CONSTRAINT "FK_membership_payments_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP CONSTRAINT "FK_membership_payments_membership_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_configurations_event_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_configurations_billing_cycle"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_configurations_voucher_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_membership_voucher_configurations_event_billing_voucher"`,
    );
    await queryRunner.query(`DROP TABLE "membership_voucher_configurations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_grants_grant_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_grants_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_voucher_grants_membership_id"`,
    );
    await queryRunner.query(`DROP TABLE "membership_voucher_grants"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_payments_paid_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_payments_payment_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_payments_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_payments_membership_id"`,
    );
    await queryRunner.query(`DROP TABLE "membership_payments"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_memberships_ends_at"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_memberships_billing_cycle"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_memberships_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_memberships_user_id_active_or_grace"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_memberships_user_id"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
    await queryRunner.query(
      `DROP TYPE "public"."membership_voucher_configurations_event_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_voucher_grants_grant_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_payments_payment_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_payments_billing_cycle_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."memberships_billing_cycle_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."memberships_status_enum"`);
  }
}
