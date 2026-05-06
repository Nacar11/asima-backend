import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWalletsTables1772684781666 implements MigrationInterface {
  name = '1772100000002CreateWalletsTables1772684781666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create wallets table
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "wallet_type" character varying(10) NOT NULL DEFAULT 'seller', "seller_id" integer, "balance" numeric(12,2) NOT NULL DEFAULT '0', "pending_balance" numeric(12,2) NOT NULL DEFAULT '0', "total_credited" numeric(12,2) NOT NULL DEFAULT '0', "total_debited" numeric(12,2) NOT NULL DEFAULT '0', "currency_code" character varying(3) NOT NULL DEFAULT 'PHP', "status" character varying(10) NOT NULL DEFAULT 'active', "frozen_reason" character varying(255), "debt_amount" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" integer, "updated_by" integer, "deleted_by" integer, CONSTRAINT "CHK_1c1bf32c2aa1b0f104543f3d6a" CHECK ("balance" >= 0), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_79e9c3c76ea89e2334986f1e32" ON "wallets" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bfa39dea507cf37e74c48a4712" ON "wallets" ("seller_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92558c08091598f7a4439586cd" ON "wallets" ("user_id") `,
    );

    // Create wallet_transactions table
    await queryRunner.query(
      `CREATE TABLE "wallet_transactions" ("id" SERIAL NOT NULL, "wallet_id" integer NOT NULL, "transaction_number" character varying(30) NOT NULL, "transaction_type" character varying(20) NOT NULL, "direction" character varying(6) NOT NULL, "amount" numeric(12,2) NOT NULL, "balance_before" numeric(12,2) NOT NULL, "balance_after" numeric(12,2) NOT NULL, "description" character varying(500), "reference_type" character varying(30), "reference_id" integer, "status" character varying(15) NOT NULL DEFAULT 'completed', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, CONSTRAINT "UQ_f47d355c12cd233da4e1a239cd3" UNIQUE ("transaction_number"), CONSTRAINT "PK_5120f131bde2cda940ec1a621db" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3ac3b5ed7e3475ab13a5cda4c" ON "wallet_transactions" ("reference_type", "reference_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a04d216886e3ef724e3fbdbbb" ON "wallet_transactions" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff61a0b4d3d9b4b8f52538d0ca" ON "wallet_transactions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51eb84372a8d12f2f131c25ffe" ON "wallet_transactions" ("transaction_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c57d19129968160f4db28fc8b2" ON "wallet_transactions" ("wallet_id") `,
    );
    await queryRunner.query(`
  CREATE UNIQUE INDEX "uq_wallet_tx_idempotency"
  ON "wallet_transactions" ("wallet_id", "reference_type", "reference_id", "transaction_type")
  WHERE "reference_id" IS NOT NULL
`);

    // Create wallet_withdrawals table
    await queryRunner.query(
      `CREATE TABLE "wallet_withdrawals" ("id" SERIAL NOT NULL, "wallet_id" integer NOT NULL, "wallet_transaction_id" integer, "bank_account_id" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "processing_fee" numeric(10,2) NOT NULL DEFAULT '0', "net_amount" numeric(12,2) NOT NULL, "status" character varying(15) NOT NULL DEFAULT 'pending', "failure_reason" character varying(500), "bank_reference_number" character varying(100), "requested_at" TIMESTAMP NOT NULL DEFAULT now(), "processed_at" TIMESTAMP, "completed_at" TIMESTAMP, "processed_by_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" integer, "updated_by" integer, "deleted_by" integer, CONSTRAINT "PK_8683ec82b0640730c9453d6b859" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_10847dab428886546bb067b867" ON "wallet_withdrawals" ("requested_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dac744fc4dd94d79755e42a561" ON "wallet_withdrawals" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39e249cb65aafbd947db884619" ON "wallet_withdrawals" ("wallet_id") `,
    );

    // Foreign keys for wallets
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_bfa39dea507cf37e74c48a47122" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_ef99b87c458deed4bdc0356f319" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_29c5b1c55268105f6de2b153e35" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_d3d6a6502f6d5b45ce3a8a14557" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Foreign keys for wallet_transactions
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_c57d19129968160f4db28fc8b28" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_189407c20ccf26e279c55eee73e" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Foreign keys for wallet_withdrawals
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "FK_39e249cb65aafbd947db8846195" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "FK_603d88fe4a5d572b81f3c750e00" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "FK_0028df64ec1fef4ecdfb38298af" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "FK_e3198f77281cafef98bc21a64aa" FOREIGN KEY ("processed_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "FK_2316a2063079bd1dcb455aea3ae" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "FK_dc3d97692267c4aaee53499c762" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "FK_9d67eb5f62564a86b5edce28e0c" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop wallet_withdrawals foreign keys
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP CONSTRAINT "FK_9d67eb5f62564a86b5edce28e0c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP CONSTRAINT "FK_dc3d97692267c4aaee53499c762"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP CONSTRAINT "FK_2316a2063079bd1dcb455aea3ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP CONSTRAINT "FK_e3198f77281cafef98bc21a64aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP CONSTRAINT "FK_0028df64ec1fef4ecdfb38298af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP CONSTRAINT "FK_603d88fe4a5d572b81f3c750e00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP CONSTRAINT "FK_39e249cb65aafbd947db8846195"`,
    );

    // Drop wallet_transactions foreign keys
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_189407c20ccf26e279c55eee73e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_c57d19129968160f4db28fc8b28"`,
    );

    // Drop wallets foreign keys
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_d3d6a6502f6d5b45ce3a8a14557"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_29c5b1c55268105f6de2b153e35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_ef99b87c458deed4bdc0356f319"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_bfa39dea507cf37e74c48a47122"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`,
    );

    // Drop indexes and tables
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39e249cb65aafbd947db884619"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dac744fc4dd94d79755e42a561"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_10847dab428886546bb067b867"`,
    );
    await queryRunner.query(`DROP TABLE "wallet_withdrawals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c57d19129968160f4db28fc8b2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_51eb84372a8d12f2f131c25ffe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff61a0b4d3d9b4b8f52538d0ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a04d216886e3ef724e3fbdbbb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3ac3b5ed7e3475ab13a5cda4c"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_wallet_tx_idempotency"`);
    await queryRunner.query(`DROP TABLE "wallet_transactions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92558c08091598f7a4439586cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bfa39dea507cf37e74c48a4712"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79e9c3c76ea89e2334986f1e32"`,
    );
    await queryRunner.query(`DROP TABLE "wallets"`);
  }
}
