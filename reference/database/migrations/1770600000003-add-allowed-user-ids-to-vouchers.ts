import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllowedUserIdsToVouchers1770600000003
  implements MigrationInterface
{
  name = 'AddAllowedUserIdsToVouchers1770600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD COLUMN "allowed_user_ids" integer[] DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP COLUMN "allowed_user_ids"`,
    );
  }
}
