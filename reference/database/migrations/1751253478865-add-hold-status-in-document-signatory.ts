import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHoldStatusInDocumentSignatory1751253478865
  implements MigrationInterface
{
  name = 'AddHoldStatusInDocumentSignatory1751253478865';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."document_signatory_status_enum" RENAME TO "document_signatory_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."document_signatory_status_enum" AS ENUM('Active', 'Cancelled', 'Hold')`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ALTER COLUMN "status" TYPE "public"."document_signatory_status_enum" USING "status"::"text"::"public"."document_signatory_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ALTER COLUMN "status" SET DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."document_signatory_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."document_signatory_status_enum_old" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ALTER COLUMN "status" TYPE "public"."document_signatory_status_enum_old" USING "status"::"text"::"public"."document_signatory_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ALTER COLUMN "status" SET DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."document_signatory_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."document_signatory_status_enum_old" RENAME TO "document_signatory_status_enum"`,
    );
  }
}
