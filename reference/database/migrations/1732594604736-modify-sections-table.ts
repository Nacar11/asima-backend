import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifySectionsTable1732594604736 implements MigrationInterface {
  name = 'ModifySectionsTable1732594604736';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "section" RENAME COLUMN "section_status" TO "status"`,
    );
    await queryRunner.query(`ALTER TABLE "section" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."section_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD "status" "public"."section_status_enum" NOT NULL DEFAULT 'Active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "section" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."section_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "section" ADD "status" character NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" RENAME COLUMN "status" TO "section_status"`,
    );
  }
}
