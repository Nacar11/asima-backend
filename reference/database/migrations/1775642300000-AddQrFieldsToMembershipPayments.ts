import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrFieldsToMembershipPayments1775642300000
  implements MigrationInterface
{
  name = 'AddQrFieldsToMembershipPayments1775642300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN IF NOT EXISTS "payment_method_code" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN IF NOT EXISTS "payment_proof_url" character varying(1000)`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" ADD COLUMN IF NOT EXISTS "payment_proof_key" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN IF EXISTS "payment_proof_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN IF EXISTS "payment_proof_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN IF EXISTS "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_payments" DROP COLUMN IF EXISTS "payment_method_code"`,
    );
  }
}
