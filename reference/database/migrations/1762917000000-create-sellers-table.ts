import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSellersTable1762917000000 implements MigrationInterface {
  name = 'CreateSellersTable1762917000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the sellers_status_enum type
    await queryRunner.query(
      `CREATE TYPE "public"."sellers_status_enum" AS ENUM('Active', 'Cancelled', 'Hold')`,
    );

    await queryRunner.query(
      `CREATE TABLE "sellers" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "store_name" character varying(255) NOT NULL, "store_description" text, "store_logo_url" character varying(500), "store_banner_url" character varying(500), "business_registration_number" character varying(100), "tax_id" character varying(100), "bank_account_holder" character varying(255), "bank_account_number" character varying(50), "bank_name" character varying(100), "is_verified" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "status" "public"."sellers_status_enum" NOT NULL DEFAULT 'Active', "total_sales" numeric(15,2) NOT NULL DEFAULT '0', "total_reviews" integer NOT NULL DEFAULT '0', "created_by" integer NOT NULL, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_sellers_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_sellers_user_id" UNIQUE ("user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sellers_store_name" ON "sellers" ("store_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sellers_is_verified" ON "sellers" ("is_verified")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sellers_status" ON "sellers" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD CONSTRAINT "FK_sellers_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD CONSTRAINT "FK_sellers_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD CONSTRAINT "FK_sellers_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD CONSTRAINT "FK_sellers_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP CONSTRAINT "FK_sellers_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP CONSTRAINT "FK_sellers_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP CONSTRAINT "FK_sellers_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP CONSTRAINT "FK_sellers_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_sellers_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sellers_is_verified"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sellers_store_name"`);
    await queryRunner.query(`DROP TABLE "sellers"`);
    await queryRunner.query(`DROP TYPE "public"."sellers_status_enum"`);
  }
}
