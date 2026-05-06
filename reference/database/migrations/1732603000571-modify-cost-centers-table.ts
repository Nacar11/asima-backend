import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyCostCentersTable1732603000571 implements MigrationInterface {
  name = 'ModifyCostCentersTable1732603000571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cost_center" RENAME COLUMN "cost_center_status" TO "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE "cost_center_id_seq"`);
    await queryRunner.query(`ALTER TABLE "cost_center" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."cost_center_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "status" "public"."cost_center_status_enum" NOT NULL DEFAULT 'Active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cost_center" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."cost_center_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "status" character NOT NULL`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "cost_center_id_seq" OWNED BY "cost_center"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ALTER COLUMN "id" SET DEFAULT nextval('"cost_center_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" RENAME COLUMN "status" TO "cost_center_status"`,
    );
  }
}
