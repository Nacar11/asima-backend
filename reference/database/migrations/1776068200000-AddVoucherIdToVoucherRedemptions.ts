import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoucherIdToVoucherRedemptions1776068200000
  implements MigrationInterface
{
  name = 'AddVoucherIdToVoucherRedemptions1776068200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "voucher_redemptions"
      ADD COLUMN IF NOT EXISTS "voucher_id" integer
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_voucher_redemptions_voucher_id"
      ON "voucher_redemptions" ("voucher_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_voucher_redemptions_voucher_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "voucher_redemptions"
      DROP COLUMN IF EXISTS "voucher_id"
    `);
  }
}
