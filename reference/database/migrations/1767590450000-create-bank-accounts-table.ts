import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create bank_accounts table.
 *
 * This table stores user bank account information with encrypted account numbers.
 * References the banks table for bank selection.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateBankAccountsTable1767590450000
  implements MigrationInterface
{
  name = 'CreateBankAccountsTable1767590450000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bank_accounts" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "bank_id" integer NOT NULL,
        "account_holder_name" character varying(100) NOT NULL,
        "account_number_encrypted" text NOT NULL,
        "last_four" character varying(4),
        "account_type" character varying(20),
        "is_default" boolean NOT NULL DEFAULT false,
        "status" character varying(20) NOT NULL DEFAULT 'unverified',
        "verified_at" TIMESTAMP,
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_bank_accounts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bank_accounts_user_id" ON "bank_accounts" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bank_accounts_bank_id" ON "bank_accounts" ("bank_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bank_accounts_status" ON "bank_accounts" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bank_accounts_is_default" ON "bank_accounts" ("is_default")
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts"
      ADD CONSTRAINT "FK_bank_accounts_user_id"
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts"
      ADD CONSTRAINT "FK_bank_accounts_bank_id"
      FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts"
      ADD CONSTRAINT "FK_bank_accounts_created_by"
      FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts"
      ADD CONSTRAINT "FK_bank_accounts_updated_by"
      FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts"
      ADD CONSTRAINT "FK_bank_accounts_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Partial unique index: only one is_default=true per user_id (excluding soft-deleted)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_bank_accounts_one_default_per_user"
      ON "bank_accounts" ("user_id")
      WHERE "is_default" = true AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_bank_accounts_one_default_per_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_bank_accounts_deleted_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_bank_accounts_updated_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_bank_accounts_created_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_bank_accounts_bank_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_bank_accounts_user_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_bank_accounts_is_default"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_bank_accounts_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_bank_accounts_bank_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_bank_accounts_user_id"
    `);

    await queryRunner.query(`
      DROP TABLE "bank_accounts"
    `);
  }
}
