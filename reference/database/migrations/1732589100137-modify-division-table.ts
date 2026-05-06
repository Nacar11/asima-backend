import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyDivisionTable1732589100137 implements MigrationInterface {
  name = 'ModifyDivisionTable1732589100137';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "division" RENAME COLUMN "division_status" TO "status"`,
    );
    await queryRunner.query(`ALTER TABLE "division" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."division_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" ADD "status" "public"."division_status_enum" NOT NULL DEFAULT 'Active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "division" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."division_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "division" ADD "status" character NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" RENAME COLUMN "status" TO "division_status"`,
    );
  }
}
