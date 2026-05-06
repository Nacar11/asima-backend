import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserTableCostCenterNotNullable1745980930609
  implements MigrationInterface
{
  name = 'AlterUserTableCostCenterNotNullable1745980930609';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN cost_center SET NOT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN cost_center DROP NOT NULL;"`,
    );
  }
}
