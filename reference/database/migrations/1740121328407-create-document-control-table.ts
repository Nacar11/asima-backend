import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentControlTable1740121328407
  implements MigrationInterface
{
  name = 'CreateDocumentControlTable1740121328407';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."document_control_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_control" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."document_control_status_enum" NOT NULL DEFAULT 'Active', "prefix_pattern" character varying(10) NOT NULL, "last_series" integer NOT NULL, "created_by" integer, "updated_by" integer, "deleted_by" integer, "menu_id" integer, CONSTRAINT "REL_61c28ff224959bc9a8d87d3fd3" UNIQUE ("menu_id"), CONSTRAINT "PK_d5fc0d907f3b59f1a181c1e2806" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ADD CONSTRAINT "FK_95344dea282ac51678c67602074" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ADD CONSTRAINT "FK_80add790bfee7f59f9b08526396" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ADD CONSTRAINT "FK_fdfea58a8cf281b71acdfb6320c" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" ADD CONSTRAINT "FK_61c28ff224959bc9a8d87d3fd31" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_control" DROP CONSTRAINT "FK_61c28ff224959bc9a8d87d3fd31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" DROP CONSTRAINT "FK_fdfea58a8cf281b71acdfb6320c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" DROP CONSTRAINT "FK_80add790bfee7f59f9b08526396"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_control" DROP CONSTRAINT "FK_95344dea282ac51678c67602074"`,
    );
    await queryRunner.query(`DROP TABLE "document_control"`);
    await queryRunner.query(
      `DROP TYPE "public"."document_control_status_enum"`,
    );
  }
}
