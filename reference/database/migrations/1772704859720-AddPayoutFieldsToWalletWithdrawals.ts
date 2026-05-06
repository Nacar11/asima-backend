import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayoutFieldsToWalletWithdrawals1772704859720
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD "payout_provider" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD "payout_reference" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD "payout_status" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ADD "payout_dispatched_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP COLUMN "payout_dispatched_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP COLUMN "payout_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP COLUMN "payout_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" DROP COLUMN "payout_provider"`,
    );
  }
}
