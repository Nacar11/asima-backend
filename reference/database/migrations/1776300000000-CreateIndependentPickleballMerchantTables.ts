import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndependentPickleballMerchantTables1776300000000
  implements MigrationInterface
{
  name = 'CreateIndependentPickleballMerchantTables1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "must_change_password" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(`
      CREATE TABLE "pickleball_merchant_applications" (
        "id" SERIAL NOT NULL,
        "application_number" varchar(50) NOT NULL,
        "merchant_name" varchar(255) NOT NULL,
        "location_name" varchar(255),
        "merchant_description" text,
        "contact_name" varchar(255),
        "contact_phone" varchar(50),
        "owner_email" varchar(255) NOT NULL,
        "approver_email" varchar(255) NOT NULL,
        "address_line" varchar(255),
        "province" varchar(100),
        "city" varchar(100),
        "barangay" varchar(100),
        "postal_code" varchar(20),
        "latitude" numeric(10,8),
        "longitude" numeric(11,8),
        "gcash_qr_image_url" varchar(500),
        "status" varchar(40) NOT NULL DEFAULT 'submitted',
        "review_notes" text,
        "rejection_reason" text,
        "reviewed_at" TIMESTAMPTZ,
        "owner_user_id" integer,
        "approver_user_id" integer,
        "seller_id" integer,
        "subscription_id" integer,
        "reviewed_by" integer,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_pickleball_merchant_applications_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pickleball_merchant_applications_number" UNIQUE ("application_number"),
        CONSTRAINT "UQ_pickleball_merchant_applications_owner_user_id" UNIQUE ("owner_user_id"),
        CONSTRAINT "UQ_pickleball_merchant_applications_approver_user_id" UNIQUE ("approver_user_id"),
        CONSTRAINT "UQ_pickleball_merchant_applications_seller_id" UNIQUE ("seller_id"),
        CONSTRAINT "UQ_pickleball_merchant_applications_subscription_id" UNIQUE ("subscription_id"),
        CONSTRAINT "FK_pickleball_merchant_applications_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_pickleball_merchant_applications_owner_user_id" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_pickleball_merchant_applications_approver_user_id" FOREIGN KEY ("approver_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_pickleball_merchant_applications_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_pickleball_merchant_applications_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pickleball_merchant_applications_status" ON "pickleball_merchant_applications" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pickleball_merchant_applications_created_at" ON "pickleball_merchant_applications" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pickleball_merchant_applications_owner_email" ON "pickleball_merchant_applications" ("owner_email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pickleball_merchant_applications_approver_email" ON "pickleball_merchant_applications" ("approver_email")`,
    );

    await queryRunner.query(`
      CREATE TABLE "pickleball_merchant_application_courts" (
        "id" SERIAL NOT NULL,
        "application_id" integer NOT NULL,
        "name" varchar(120) NOT NULL,
        "description" varchar(500),
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pickleball_merchant_application_courts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pickleball_merchant_application_courts_application_id" FOREIGN KEY ("application_id") REFERENCES "pickleball_merchant_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pickleball_merchant_application_courts_application_id" ON "pickleball_merchant_application_courts" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pickleball_merchant_application_courts_display_order" ON "pickleball_merchant_application_courts" ("display_order")`,
    );

    await queryRunner.query(`
      CREATE TABLE "pickleball_locations" (
        "id" SERIAL NOT NULL,
        "key" varchar(100) NOT NULL,
        "name" varchar(120) NOT NULL,
        "subtitle" varchar(120),
        "store_name" varchar(255),
        "address_line" varchar(255),
        "province" varchar(100),
        "city" varchar(100),
        "barangay" varchar(100),
        "postal_code" varchar(20),
        "source_type" varchar(40) NOT NULL DEFAULT 'independent_merchant',
        "seller_id" integer NOT NULL,
        "application_id" integer,
        "image_url" varchar(500),
        "background_image_url" varchar(500),
        "status" varchar(32) NOT NULL DEFAULT 'active',
        "display_order" integer NOT NULL DEFAULT 100,
        "created_by" integer,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_pickleball_locations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pickleball_locations_key" UNIQUE ("key"),
        CONSTRAINT "UQ_pickleball_locations_seller_id" UNIQUE ("seller_id"),
        CONSTRAINT "UQ_pickleball_locations_application_id" UNIQUE ("application_id"),
        CONSTRAINT "FK_pickleball_locations_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_pickleball_locations_application_id" FOREIGN KEY ("application_id") REFERENCES "pickleball_merchant_applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_pickleball_locations_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_pickleball_locations_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_pickleball_locations_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pickleball_locations_status" ON "pickleball_locations" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pickleball_locations_display_order" ON "pickleball_locations" ("display_order")`,
    );

    await queryRunner.query(`
      CREATE TABLE "seller_payment_profiles" (
        "id" SERIAL NOT NULL,
        "seller_id" integer NOT NULL,
        "gcash_display_name" varchar(100) NOT NULL DEFAULT 'GCash',
        "gcash_qr_image_url" varchar(500) NOT NULL,
        "created_by" integer,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_seller_payment_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_seller_payment_profiles_seller_id" UNIQUE ("seller_id"),
        CONSTRAINT "FK_seller_payment_profiles_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payment_profiles_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payment_profiles_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_seller_payment_profiles_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_payment_profiles"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pickleball_locations_display_order"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pickleball_locations_status"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "pickleball_locations"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pickleball_merchant_application_courts_display_order"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pickleball_merchant_application_courts_application_id"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "pickleball_merchant_application_courts"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pickleball_merchant_applications_approver_email"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pickleball_merchant_applications_owner_email"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pickleball_merchant_applications_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pickleball_merchant_applications_status"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "pickleball_merchant_applications"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "must_change_password"`,
    );
  }
}
