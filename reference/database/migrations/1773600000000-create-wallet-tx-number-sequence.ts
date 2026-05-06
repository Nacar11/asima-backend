import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWalletTxNumberSequence1773600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a sequence that starts from the current max id so existing
    // transaction numbers are not re-used.
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS wallet_tx_number_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;
    `);

    // Advance the sequence past all existing rows so the first nextval()
    // call returns a number larger than any already-used id.
    await queryRunner.query(`
      SELECT setval(
        'wallet_tx_number_seq',
        COALESCE((SELECT MAX(id) FROM wallet_transactions), 0) + 1,
        false
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE IF EXISTS wallet_tx_number_seq;`);
  }
}
