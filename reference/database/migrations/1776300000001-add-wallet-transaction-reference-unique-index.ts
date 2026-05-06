import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletTransactionReferenceUniqueIndex1776300000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_wallet_tx_reference
      ON wallet_transactions (wallet_id, reference_type, reference_id, transaction_type)
      WHERE reference_id IS NOT NULL AND reference_type IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uidx_wallet_tx_reference
    `);
  }
}
