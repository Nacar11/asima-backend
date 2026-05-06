import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVoucherQrTokens1773600000000 implements MigrationInterface {
  name = 'CreateVoucherQrTokens1773600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "voucher_qr_tokens" (
        "id" SERIAL PRIMARY KEY,
        "user_voucher_id" INTEGER NOT NULL,
        "user_id" INTEGER NOT NULL,
        "voucher_id" INTEGER NOT NULL,
        "token_hash" VARCHAR(64) NOT NULL,
        "short_code" VARCHAR(12) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_qr_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "uq_qr_short_code" UNIQUE ("short_code"),
        CONSTRAINT "fk_qr_token_user_voucher" FOREIGN KEY ("user_voucher_id")
          REFERENCES "user_vouchers"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_qr_token_user" FOREIGN KEY ("user_id")
          REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_qr_token_voucher" FOREIGN KEY ("voucher_id")
          REFERENCES "vouchers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_qr_tokens_user_voucher_id" ON "voucher_qr_tokens" ("user_voucher_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_qr_tokens_expires_at" ON "voucher_qr_tokens" ("expires_at")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_qr_tokens_short_code" ON "voucher_qr_tokens" ("short_code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_qr_tokens_short_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_qr_tokens_expires_at"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_qr_tokens_user_voucher_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "voucher_qr_tokens"`);
  }
}
