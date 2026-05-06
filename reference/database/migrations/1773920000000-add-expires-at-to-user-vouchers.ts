import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpiresAtToUserVouchers1773920000000
  implements MigrationInterface
{
  name = 'AddExpiresAtToUserVouchers1773920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_vouchers"
      ADD COLUMN "expires_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_vouchers_expires_at" ON "user_vouchers" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_vouchers_expires_at"`);
    await queryRunner.query(`
      ALTER TABLE "user_vouchers" DROP COLUMN "expires_at"
    `);
  }
}
