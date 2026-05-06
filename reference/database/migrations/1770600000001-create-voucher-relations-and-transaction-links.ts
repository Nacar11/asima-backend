import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVoucherRelationsAndTransactionLinks1770600000001
  implements MigrationInterface
{
  name = 'CreateVoucherRelationsAndTransactionLinks1770600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."user_vouchers_status_enum" AS ENUM('available', 'used', 'expired')
    `);

    await queryRunner.query(`
      CREATE TABLE "user_vouchers" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "voucher_id" integer NOT NULL,
        "collected_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "status" "public"."user_vouchers_status_enum" NOT NULL DEFAULT 'available',
        "used_at" TIMESTAMP WITH TIME ZONE,
        "expired_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_vouchers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_vouchers_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_vouchers_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_vouchers_user_id" ON "user_vouchers" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_vouchers_voucher_id" ON "user_vouchers" ("voucher_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_vouchers_status" ON "user_vouchers" ("status")
    `);

    await queryRunner.query(`
      CREATE TABLE "voucher_redemptions" (
        "id" SERIAL NOT NULL,
        "voucher_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "sales_order_id" integer,
        "booking_id" integer,
        "discount_amount" numeric(10,2) NOT NULL,
        "order_subtotal" numeric(10,2) NOT NULL,
        "redeemed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_voucher_redemptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_voucher_redemptions_discount_amount_non_negative" CHECK ("discount_amount" >= 0),
        CONSTRAINT "CHK_voucher_redemptions_order_subtotal_non_negative" CHECK ("order_subtotal" >= 0),
        CONSTRAINT "CHK_voucher_redemptions_has_reference" CHECK (num_nonnulls("sales_order_id", "booking_id") >= 1),
        CONSTRAINT "FK_voucher_redemptions_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_voucher_redemptions_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_voucher_redemptions_sales_order_id" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_voucher_redemptions_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_redemptions_voucher_id" ON "voucher_redemptions" ("voucher_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_redemptions_user_id" ON "voucher_redemptions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_redemptions_sales_order_id" ON "voucher_redemptions" ("sales_order_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_redemptions_booking_id" ON "voucher_redemptions" ("booking_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_redemptions_redeemed_at" ON "voucher_redemptions" ("redeemed_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "voucher_categories" (
        "id" SERIAL NOT NULL,
        "voucher_id" integer NOT NULL,
        "category_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_voucher_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_voucher_categories_voucher_id_category_id" UNIQUE ("voucher_id", "category_id"),
        CONSTRAINT "FK_voucher_categories_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_voucher_categories_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_categories_voucher_id" ON "voucher_categories" ("voucher_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_categories_category_id" ON "voucher_categories" ("category_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "voucher_products" (
        "id" SERIAL NOT NULL,
        "voucher_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_voucher_products_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_voucher_products_voucher_id_product_id" UNIQUE ("voucher_id", "product_id"),
        CONSTRAINT "FK_voucher_products_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_voucher_products_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_products_voucher_id" ON "voucher_products" ("voucher_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_products_product_id" ON "voucher_products" ("product_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "voucher_service_categories" (
        "id" SERIAL NOT NULL,
        "voucher_id" integer NOT NULL,
        "service_category_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_voucher_service_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_voucher_service_categories_voucher_id_service_category_id" UNIQUE ("voucher_id", "service_category_id"),
        CONSTRAINT "FK_voucher_service_categories_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_voucher_service_categories_service_category_id" FOREIGN KEY ("service_category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_service_categories_voucher_id" ON "voucher_service_categories" ("voucher_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_service_categories_service_category_id" ON "voucher_service_categories" ("service_category_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "voucher_services" (
        "id" SERIAL NOT NULL,
        "voucher_id" integer NOT NULL,
        "service_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_voucher_services_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_voucher_services_voucher_id_service_id" UNIQUE ("voucher_id", "service_id"),
        CONSTRAINT "FK_voucher_services_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_voucher_services_service_id" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_services_voucher_id" ON "voucher_services" ("voucher_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_services_service_id" ON "voucher_services" ("service_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "sales_order_vouchers" (
        "id" SERIAL NOT NULL,
        "sales_order_id" integer NOT NULL,
        "voucher_id" integer NOT NULL,
        "voucher_code" character varying(20) NOT NULL,
        "voucher_discount" numeric(10,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_order_vouchers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sales_order_vouchers_sales_order_id_voucher_id" UNIQUE ("sales_order_id", "voucher_id"),
        CONSTRAINT "CHK_sales_order_vouchers_voucher_discount_non_negative" CHECK ("voucher_discount" >= 0),
        CONSTRAINT "FK_sales_order_vouchers_sales_order_id" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_order_vouchers_voucher_id" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_order_vouchers_sales_order_id" ON "sales_order_vouchers" ("sales_order_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_order_vouchers_voucher_id" ON "sales_order_vouchers" ("voucher_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_order_vouchers_voucher_code" ON "sales_order_vouchers" ("voucher_code")
    `);
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "CHK_vouchers_scope_seller_consistency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "CHK_vouchers_discount_type_cap_consistency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "discount_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."vouchers_scope_enum" RENAME TO "vouchers_scope_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_scope_enum" AS ENUM('global', 'categories', 'products', 'service-categories', 'services')`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ALTER COLUMN "scope" TYPE "public"."vouchers_scope_enum"
      USING (
        CASE
          WHEN "scope"::text = 'seller' AND "seller_id" IS NOT NULL THEN 'products'
          WHEN "scope"::text = 'seller' THEN 'global'
          ELSE "scope"::text
        END
      )::"public"."vouchers_scope_enum"
    `);
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" SET DEFAULT 'global'`,
    );
    await queryRunner.query(`DROP TYPE "public"."vouchers_scope_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."vouchers_discount_type_enum" RENAME TO "vouchers_discount_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_discount_type_enum" AS ENUM('shipping', 'fixed', 'percentage', 'b1t1')`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ALTER COLUMN "discount_type" TYPE "public"."vouchers_discount_type_enum"
      USING "discount_type"::text::"public"."vouchers_discount_type_enum"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."vouchers_discount_type_enum_old"`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_scope_seller_consistency"
      CHECK (
        ("seller_id" IS NULL AND "scope" IN ('global', 'categories')) OR
        (
          "seller_id" IS NOT NULL AND
          "scope" IN ('categories', 'products', 'service-categories', 'services')
        )
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_discount_type_cap_consistency"
      CHECK (
        ("discount_type" = 'percentage' AND "max_discount_cap" IS NOT NULL) OR
        (
          "discount_type" IN ('shipping', 'fixed', 'b1t1') AND
          "max_discount_cap" IS NULL
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_sales_order_vouchers_voucher_code"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_sales_order_vouchers_voucher_id"`);
    await queryRunner.query(
      `DROP INDEX "IDX_sales_order_vouchers_sales_order_id"`,
    );
    await queryRunner.query(`DROP TABLE "sales_order_vouchers"`);

    await queryRunner.query(`DROP INDEX "IDX_voucher_services_service_id"`);
    await queryRunner.query(`DROP INDEX "IDX_voucher_services_voucher_id"`);
    await queryRunner.query(`DROP TABLE "voucher_services"`);

    await queryRunner.query(
      `DROP INDEX "IDX_voucher_service_categories_service_category_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_voucher_service_categories_voucher_id"`,
    );
    await queryRunner.query(`DROP TABLE "voucher_service_categories"`);

    await queryRunner.query(`DROP INDEX "IDX_voucher_products_product_id"`);
    await queryRunner.query(`DROP INDEX "IDX_voucher_products_voucher_id"`);
    await queryRunner.query(`DROP TABLE "voucher_products"`);

    await queryRunner.query(`DROP INDEX "IDX_voucher_categories_category_id"`);
    await queryRunner.query(`DROP INDEX "IDX_voucher_categories_voucher_id"`);
    await queryRunner.query(`DROP TABLE "voucher_categories"`);

    await queryRunner.query(`DROP INDEX "IDX_voucher_redemptions_redeemed_at"`);
    await queryRunner.query(`DROP INDEX "IDX_voucher_redemptions_booking_id"`);
    await queryRunner.query(
      `DROP INDEX "IDX_voucher_redemptions_sales_order_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_voucher_redemptions_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_voucher_redemptions_voucher_id"`);
    await queryRunner.query(`DROP TABLE "voucher_redemptions"`);

    await queryRunner.query(`DROP INDEX "IDX_user_vouchers_status"`);
    await queryRunner.query(`DROP INDEX "IDX_user_vouchers_voucher_id"`);
    await queryRunner.query(`DROP INDEX "IDX_user_vouchers_user_id"`);
    await queryRunner.query(`DROP TABLE "user_vouchers"`);
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "CHK_vouchers_discount_type_cap_consistency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "CHK_vouchers_scope_seller_consistency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "discount_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."vouchers_scope_enum" RENAME TO "vouchers_scope_enum_new"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_scope_enum" AS ENUM('global', 'seller')`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ALTER COLUMN "scope" TYPE "public"."vouchers_scope_enum"
      USING (
        CASE
          WHEN "scope"::text = 'global' THEN 'global'
          ELSE 'seller'
        END
      )::"public"."vouchers_scope_enum"
    `);
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" SET DEFAULT 'global'`,
    );
    await queryRunner.query(`DROP TYPE "public"."vouchers_scope_enum_new"`);
    await queryRunner.query(
      `ALTER TYPE "public"."vouchers_discount_type_enum" RENAME TO "vouchers_discount_type_enum_new"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_discount_type_enum" AS ENUM('fixed', 'percentage')`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ALTER COLUMN "discount_type" TYPE "public"."vouchers_discount_type_enum"
      USING (
        CASE
          WHEN "discount_type"::text = 'percentage' THEN 'percentage'
          ELSE 'fixed'
        END
      )::"public"."vouchers_discount_type_enum"
    `);
    await queryRunner.query(
      `UPDATE "vouchers" SET "max_discount_cap" = NULL WHERE "discount_type" = 'fixed'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."vouchers_discount_type_enum_new"`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_scope_seller_consistency"
      CHECK (
        ("scope" = 'global' AND "seller_id" IS NULL) OR
        ("scope" = 'seller' AND "seller_id" IS NOT NULL)
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_discount_type_cap_consistency"
      CHECK (
        ("discount_type" = 'fixed' AND "max_discount_cap" IS NULL) OR
        ("discount_type" = 'percentage' AND "max_discount_cap" IS NOT NULL)
      )
    `);

    await queryRunner.query(`DROP TYPE "public"."user_vouchers_status_enum"`);
  }
}
