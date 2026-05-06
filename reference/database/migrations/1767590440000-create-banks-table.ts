import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create banks master table.
 *
 * This table stores the list of supported banks for user bank accounts.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateBanksTable1767590440000 implements MigrationInterface {
  name = 'CreateBanksTable1767590440000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "banks" (
        "id" SERIAL NOT NULL,
        "bank_code" character varying(20) NOT NULL,
        "bank_name" character varying(100) NOT NULL,
        "logo_url" character varying(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_banks" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_banks_bank_code" UNIQUE ("bank_code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_banks_bank_code" ON "banks" ("bank_code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_banks_bank_name" ON "banks" ("bank_name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_banks_is_active" ON "banks" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_banks_display_order" ON "banks" ("display_order")
    `);

    await queryRunner.query(`
      ALTER TABLE "banks"
      ADD CONSTRAINT "FK_banks_created_by"
      FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "banks"
      ADD CONSTRAINT "FK_banks_updated_by"
      FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "banks"
      ADD CONSTRAINT "FK_banks_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "banks" DROP CONSTRAINT "FK_banks_deleted_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "banks" DROP CONSTRAINT "FK_banks_updated_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "banks" DROP CONSTRAINT "FK_banks_created_by"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_banks_display_order"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_banks_is_active"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_banks_bank_name"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_banks_bank_code"
    `);

    await queryRunner.query(`
      DROP TABLE "banks"
    `);
  }
}
