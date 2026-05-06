import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserAddMarketplaceFields1765000100000
  implements MigrationInterface
{
  name = 'AlterUserAddMarketplaceFields1765000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."user_user_type_enum" AS ENUM('super_admin', 'store_owner', 'store_member', 'customer')
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "user_type" "public"."user_user_type_enum" NOT NULL DEFAULT 'customer',
      ADD COLUMN "phone" character varying(20),
      ADD COLUMN "email_verified" boolean NOT NULL DEFAULT false,
      ADD COLUMN "phone_verified" boolean NOT NULL DEFAULT false,
      ADD COLUMN "default_address_id" integer,
      ADD COLUMN "preferred_currency_id" integer
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_user_phone" ON "user" ("phone")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_user_type" ON "user" ("user_type")`,
    );

    await queryRunner.query(`
      ALTER TABLE "user"
      ADD CONSTRAINT "FK_user_default_address" FOREIGN KEY ("default_address_id") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
      ADD CONSTRAINT "FK_user_preferred_currency" FOREIGN KEY ("preferred_currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_user_preferred_currency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_user_default_address"`,
    );

    await queryRunner.query(`DROP INDEX "idx_user_user_type"`);
    await queryRunner.query(`DROP INDEX "idx_user_phone"`);

    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "preferred_currency_id",
      DROP COLUMN "default_address_id",
      DROP COLUMN "phone_verified",
      DROP COLUMN "email_verified",
      DROP COLUMN "phone",
      DROP COLUMN "user_type"
    `);

    await queryRunner.query(`DROP TYPE "public"."user_user_type_enum"`);
  }
}
