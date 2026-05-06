import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyDepartmentsTable1732592399504 implements MigrationInterface {
  name = 'ModifyDepartmentsTable1732592399504';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "department" RENAME COLUMN "department_status" TO "status"`,
    );
    await queryRunner.query(`ALTER TABLE "department" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."department_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD "status" "public"."department_status_enum" NOT NULL DEFAULT 'Active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "department" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."department_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "department" ADD "status" character NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" RENAME COLUMN "status" TO "department_status"`,
    );
  }
}
