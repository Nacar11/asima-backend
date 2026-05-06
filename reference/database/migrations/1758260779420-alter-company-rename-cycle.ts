import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCompanyRenameCycle1758260779420
  implements MigrationInterface
{
  name = 'AlterCompanyRenameCycle1758260779420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOldColumn = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'cylce_opening_backup'`,
    );
    if (hasOldColumn.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "company" DROP COLUMN "cylce_opening_backup"`,
      );
    }
    const hasNewColumn = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'cycle_opening_backup'`,
    );
    if (hasNewColumn.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "company" ADD "cycle_opening_backup" boolean NOT NULL DEFAULT false`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "cycle_opening_backup"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "cylce_opening_backup" boolean NOT NULL DEFAULT false`,
    );
  }
}
