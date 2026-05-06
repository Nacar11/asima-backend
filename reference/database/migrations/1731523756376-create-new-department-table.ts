import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewDepartmentTable1731523756376
  implements MigrationInterface
{
  name = 'CreateNewDepartmentTable1731523756376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "department" ("id" SERIAL NOT NULL, "department_code" character(2) NOT NULL, "department_name" character varying(100) NOT NULL, "department_head" integer NOT NULL, "department_status" character(1) NOT NULL, "created_by" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" integer NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_by" integer, "deleted_at" TIMESTAMP, CONSTRAINT "PK_c5a9435842d10adf7b0568cf387" PRIMARY KEY ("id", "department_code"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "FK_13ebc97c202f8f27c5795267177" FOREIGN KEY ("department_head") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "FK_e08733469befa8287ca4666e24c" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "FK_e0463559d2cb70c30a9e56932af" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "FK_8877c430d63b657759934f2ee43" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "FK_8877c430d63b657759934f2ee43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "FK_e0463559d2cb70c30a9e56932af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "FK_e08733469befa8287ca4666e24c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "FK_13ebc97c202f8f27c5795267177"`,
    );
    await queryRunner.query(`DROP TABLE "department"`);
  }
}
