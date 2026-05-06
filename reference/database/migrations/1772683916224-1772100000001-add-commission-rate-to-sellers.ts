import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionRateToSellers1772683916224
  implements MigrationInterface
{
  name = '1772100000001AddCommissionRateToSellers1772683916224';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD "commission_rate" numeric(5,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP COLUMN "commission_rate"`,
    );
  }
}
