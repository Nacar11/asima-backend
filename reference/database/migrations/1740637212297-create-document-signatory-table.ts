import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentSignatoryTable1740637212297
  implements MigrationInterface
{
  name = 'CreateDocumentSignatoryTable1740637212297';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."document_signatory_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_signatory" ("id" SERIAL NOT NULL, "menu_id" integer, "description" character varying(10) NOT NULL, "endorsed_by" integer, "reviewed_by" integer, "approved_by" integer, "status" "public"."document_signatory_status_enum" NOT NULL DEFAULT 'Active', "created_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" integer, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_by" integer, "deleted_at" TIMESTAMP, CONSTRAINT "REL_486918f33fd2bd8174e2cff3aa" UNIQUE ("menu_id"), CONSTRAINT "PK_cc4983cca113cb7bc4953641c81" PRIMARY KEY ("id")
)`,
    );

    await queryRunner.query(
      `ALTER TABLE "document_signatory" ADD CONSTRAINT "FK_625bd191d81be1c25abd32d132a" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ADD CONSTRAINT "FK_10c3ccf98b38ed140f57a894d4d" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ADD CONSTRAINT "FK_7f066f39025537ec4675a98c3f4" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ADD CONSTRAINT "FK_486918f33fd2bd8174e2cff3aab" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ADD CONSTRAINT "FK_417653e0e4a8f52d2fbc5af69d6" FOREIGN KEY ("endorsed_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ADD CONSTRAINT "FK_caf56348b41734d272d7e25ad7b" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" ADD CONSTRAINT "FK_dce5ebe09e32f994d3b077d8542" FOREIGN KEY ("approved_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_signatory" DROP CONSTRAINT "FK_dce5ebe09e32f994d3b077d8542"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" DROP CONSTRAINT "FK_caf56348b41734d272d7e25ad7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" DROP CONSTRAINT "FK_417653e0e4a8f52d2fbc5af69d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" DROP CONSTRAINT "FK_486918f33fd2bd8174e2cff3aab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" DROP CONSTRAINT "FK_7f066f39025537ec4675a98c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" DROP CONSTRAINT "FK_10c3ccf98b38ed140f57a894d4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_signatory" DROP CONSTRAINT "FK_625bd191d81be1c25abd32d132a"`,
    );

    await queryRunner.query(`DROP TABLE "document_signatory"`);
    await queryRunner.query(
      `DROP TYPE "public"."document_signatory_status_enum"`,
    );
  }
}
