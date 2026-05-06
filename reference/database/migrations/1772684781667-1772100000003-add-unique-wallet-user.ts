import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueWalletUser1772684781667 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_wallet_user_type" ON "wallets" ("user_id", "wallet_type") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "uq_wallet_user_type"`);
  }
}
