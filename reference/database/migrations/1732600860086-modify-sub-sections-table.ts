import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifySubSectionsTable1732600860086 implements MigrationInterface {
  name = 'ModifySubSectionsTable1732600860086';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sub_section" RENAME COLUMN "sub_section_status" TO "status"`,
    );
    await queryRunner.query(`ALTER TABLE "sub_section" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."sub_section_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD "status" "public"."sub_section_status_enum" NOT NULL DEFAULT 'Active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sub_section" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."sub_section_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD "status" character NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" RENAME COLUMN "status" TO "sub_section_status"`,
    );
  }
}
