import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCurrenciesTable1765000000000 implements MigrationInterface {
  name = 'CreateCurrenciesTable1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "currencies" (
        "id" SERIAL PRIMARY KEY,
        "code" character varying(3) NOT NULL,
        "name" character varying(100) NOT NULL,
        "symbol" character varying(10),
        "exchange_rate_to_php" numeric(15,6) NOT NULL DEFAULT 1,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_currencies_code" UNIQUE ("code"),
        CONSTRAINT "FK_currencies_created_by"
          FOREIGN KEY ("created_by") REFERENCES "user"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_currencies_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "user"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_currencies_deleted_by"
          FOREIGN KEY ("deleted_by") REFERENCES "user"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_currencies_code" ON "currencies" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_currencies_is_active" ON "currencies" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_currencies_deleted_at" ON "currencies" ("deleted_at")`,
    );

    await queryRunner.query(`
      INSERT INTO "currencies" ("code", "name", "symbol", "exchange_rate_to_php", "is_active", "created_at", "updated_at")
      VALUES
        ('PHP', 'Philippine Peso', '₱', 1.000000, true, now(), now()),
        ('USD', 'US Dollar', '$', 56.000000, true, now(), now())
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_currencies_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_currencies_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_currencies_code"`);
    await queryRunner.query(`DROP TABLE "currencies"`);
  }
}
