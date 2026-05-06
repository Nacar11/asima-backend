import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterEmployeeAttachedFileAndCreateAttachmentsTable1734415561941
  implements MigrationInterface
{
  name = 'AlterEmployeeAttachedFileAndCreateAttachmentsTable1734415561941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."attachments_record_type_enum" AS ENUM('Employee Certificate')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attachments_file_type_enum" AS ENUM('PDF', 'JPEG', 'PNG', 'DOCX', 'XLSX', 'CSV', 'TXT', 'MP4', 'MP3', 'ZIP', 'RAR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attachments_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attachments" (
        "id" SERIAL NOT NULL, 
        "record_type" "public"."attachments_record_type_enum" NOT NULL, 
        "record_id" integer NOT NULL, 
        "file_name" character varying NOT NULL, 
        "file_path" character varying NOT NULL, 
        "file_type" "public"."attachments_file_type_enum" NOT NULL, 
        "status" "public"."attachments_status_enum" NOT NULL DEFAULT 'Active', 
        "created_by" integer NOT NULL, 
        "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
        "updated_by" integer NOT NULL, 
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
        "deleted_by" integer, 
        "deleted_at" TIMESTAMP, 
        CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id")
        );`,
    );
    // TODO: Create another migration to add this to ERP Base branch
    // await queryRunner.query(
    //   `ALTER TABLE "employee_certifications" DROP COLUMN "attached_file"`,
    // );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_2d59febd2d8b3c772a11c35487e" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_17ec62be790c56a321562155227" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_680d03760779780d2eeb76d198e" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_680d03760779780d2eeb76d198e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_17ec62be790c56a321562155227"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_2d59febd2d8b3c772a11c35487e"`,
    );
    // TODO: Create another migration to add this to ERP Base branch
    // await queryRunner.query(
    //   `ALTER TABLE "employee_certifications" ADD "attached_file" character varying(255) NOT NULL`,
    // );
    await queryRunner.query(`DROP TABLE "attachments"`);
    await queryRunner.query(`DROP TYPE "public"."attachments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."attachments_file_type_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."attachments_record_type_enum"`,
    );
  }
}
