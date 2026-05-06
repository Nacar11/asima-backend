import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDocumentControlsStatusEnum1760580527493
  implements MigrationInterface
{
  name = 'AlterDocumentControlsStatusEnum1760580527493';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."document_control_status_enum" RENAME TO "document_control_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."document_control_status_enum" AS ENUM('Active', 'Cancelled', 'New', 'Hold')`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "status" TYPE "public"."document_control_status_enum" USING "status"::"text"::"public"."document_control_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "status" SET DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."document_control_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "prefix_pattern" TYPE VARCHAR(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "prefix_pattern" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "prefix_pattern" TYPE VARCHAR`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "prefix_pattern" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."document_control_status_enum_old" AS ENUM('Active', 'Cancelled', 'Hold')`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "status" TYPE "public"."document_control_status_enum_old" USING "status"::"text"::"public"."document_control_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ALTER COLUMN "status" SET DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."document_control_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."document_control_status_enum_old" RENAME TO "document_control_status_enum"`,
    );
  }
}
