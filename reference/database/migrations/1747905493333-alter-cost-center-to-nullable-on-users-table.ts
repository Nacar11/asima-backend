import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCostCenterToNullableOnUsersTable1747905493333
  implements MigrationInterface
{
  name = 'AlterCostCenterToNullableOnUsersTable1747905493333';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "cost_center" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2" FOREIGN KEY ("cost_center") REFERENCES "cost_center"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "cost_center" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2" FOREIGN KEY ("cost_center") REFERENCES "cost_center"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
