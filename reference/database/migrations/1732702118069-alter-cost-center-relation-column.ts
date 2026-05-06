import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCostCenterRelationColumn1732702118069
  implements MigrationInterface
{
  name = 'AlterCostCenterRelationColumn1732702118069';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "cost_center_id_seq" OWNED BY "cost_center"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ALTER COLUMN "id" SET DEFAULT nextval('"cost_center_id_seq"')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cost_center" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE "cost_center_id_seq"`);
  }
}
