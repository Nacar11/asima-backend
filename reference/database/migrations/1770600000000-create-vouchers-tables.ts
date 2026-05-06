import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVouchersTables1770600000000 implements MigrationInterface {
  name = 'CreateVouchersTables1770600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."vouchers_scope_enum" AS ENUM('global', 'seller')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."vouchers_discount_type_enum" AS ENUM('fixed', 'percentage')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."vouchers_status_enum" AS ENUM('active', 'inactive', 'expired')
    `);

    await queryRunner.query(`
      CREATE TABLE "vouchers" (
        "id" SERIAL NOT NULL,
        "code" character varying(20) NOT NULL,
        "scope" "public"."vouchers_scope_enum" NOT NULL DEFAULT 'global',
        "seller_id" integer,
        "discount_type" "public"."vouchers_discount_type_enum" NOT NULL,
        "discount_value" numeric(10,2) NOT NULL,
        "max_discount_cap" numeric(10,2),
        "min_order_amount" numeric(10,2) NOT NULL DEFAULT 0,
        "total_limit" integer,
        "per_user_limit" integer NOT NULL DEFAULT 1,
        "used_count" integer NOT NULL DEFAULT 0,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "public"."vouchers_status_enum" NOT NULL DEFAULT 'active',
        "is_claimable" boolean NOT NULL DEFAULT false,
        "description" character varying(500),
        "terms_and_conditions" text,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_vouchers_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_vouchers_date_range" CHECK ("starts_at" <= "expires_at"),
        CONSTRAINT "CHK_vouchers_discount_value_non_negative" CHECK ("discount_value" >= 0),
        CONSTRAINT "CHK_vouchers_max_discount_cap_non_negative" CHECK ("max_discount_cap" IS NULL OR "max_discount_cap" >= 0),
        CONSTRAINT "CHK_vouchers_min_order_amount_non_negative" CHECK ("min_order_amount" >= 0),
        CONSTRAINT "CHK_vouchers_total_limit_positive" CHECK ("total_limit" IS NULL OR "total_limit" > 0),
        CONSTRAINT "CHK_vouchers_per_user_limit_positive" CHECK ("per_user_limit" > 0),
        CONSTRAINT "CHK_vouchers_used_count_non_negative" CHECK ("used_count" >= 0),
        CONSTRAINT "CHK_vouchers_total_limit_ge_used_count" CHECK ("total_limit" IS NULL OR "total_limit" >= "used_count"),
        CONSTRAINT "CHK_vouchers_scope_seller_consistency" CHECK (("scope" = 'global' AND "seller_id" IS NULL) OR ("scope" = 'seller' AND "seller_id" IS NOT NULL)),
        CONSTRAINT "CHK_vouchers_discount_type_cap_consistency" CHECK (("discount_type" = 'fixed' AND "max_discount_cap" IS NULL) OR ("discount_type" = 'percentage' AND "max_discount_cap" IS NOT NULL)),
        CONSTRAINT "FK_vouchers_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_vouchers_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_vouchers_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_vouchers_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_vouchers_code_upper" ON "vouchers" (UPPER("code"))
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vouchers_code" ON "vouchers" ("code")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vouchers_scope" ON "vouchers" ("scope")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vouchers_seller_id" ON "vouchers" ("seller_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vouchers_status" ON "vouchers" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vouchers_starts_at" ON "vouchers" ("starts_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vouchers_expires_at" ON "vouchers" ("expires_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vouchers_deleted_at" ON "vouchers" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vouchers_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_vouchers_expires_at"`);
    await queryRunner.query(`DROP INDEX "IDX_vouchers_starts_at"`);
    await queryRunner.query(`DROP INDEX "IDX_vouchers_status"`);
    await queryRunner.query(`DROP INDEX "IDX_vouchers_seller_id"`);
    await queryRunner.query(`DROP INDEX "IDX_vouchers_scope"`);
    await queryRunner.query(`DROP INDEX "IDX_vouchers_code"`);
    await queryRunner.query(`DROP INDEX "IDX_vouchers_code_upper"`);
    await queryRunner.query(`DROP TABLE "vouchers"`);

    await queryRunner.query(`DROP TYPE "public"."vouchers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vouchers_discount_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vouchers_scope_enum"`);
  }
}
