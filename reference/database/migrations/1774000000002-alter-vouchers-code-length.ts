import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterVouchersCodeLength1774000000002
  implements MigrationInterface
{
  name = 'AlterVouchersCodeLength1774000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "code" TYPE character varying(30)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "code" TYPE character varying(20)`,
    );
  }
}
