import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewSectionTable1731565048428 implements MigrationInterface {
  name = 'CreateNewSectionTable1731565048428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "section" ("id" SERIAL NOT NULL, "section_code" character(2) NOT NULL, "section_name" character varying(100) NOT NULL, "section_head" integer NOT NULL, "section_status" character(1) NOT NULL, "created_by" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" integer NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_by" integer, "deleted_at" TIMESTAMP, CONSTRAINT "PK_c41e49939583a16accc67771955" PRIMARY KEY ("id", "section_code"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD CONSTRAINT "FK_4dfbbead2f5388bb1f5be870278" FOREIGN KEY ("section_head") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD CONSTRAINT "FK_954e86fb76128a9f2ec0676f003" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD CONSTRAINT "FK_554984cfef0e6f505c58cdeaa98" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD CONSTRAINT "FK_dad64e9f48584e526cc8d276741" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "section" DROP CONSTRAINT "FK_dad64e9f48584e526cc8d276741"`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" DROP CONSTRAINT "FK_554984cfef0e6f505c58cdeaa98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" DROP CONSTRAINT "FK_954e86fb76128a9f2ec0676f003"`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" DROP CONSTRAINT "FK_4dfbbead2f5388bb1f5be870278"`,
    );
    await queryRunner.query(`DROP TABLE "section"`);
  }
}
