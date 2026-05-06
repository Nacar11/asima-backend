import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewSubSectionTable1731575988453
  implements MigrationInterface
{
  name = 'CreateNewSubSectionTable1731575988453';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sub_section" ("id" SERIAL NOT NULL, "sub_section_code" character(2) NOT NULL, "sub_section_name" character varying(100) NOT NULL, "sub_section_head" integer NOT NULL, "sub_section_status" character(1) NOT NULL, "created_by" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" integer NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_by" integer, "deleted_at" TIMESTAMP, CONSTRAINT "PK_dd1754f1efedcce31ddacd89f23" PRIMARY KEY ("id", "sub_section_code"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD CONSTRAINT "FK_7b0a10ce3f3ba6cb18213769813" FOREIGN KEY ("sub_section_head") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD CONSTRAINT "FK_1e3d5b8107581eff2dcce6b13ca" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD CONSTRAINT "FK_82ffcf71d232f5fd10965aa1108" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD CONSTRAINT "FK_aeda06687fea4df6308cff4a44e" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sub_section" DROP CONSTRAINT "FK_aeda06687fea4df6308cff4a44e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" DROP CONSTRAINT "FK_82ffcf71d232f5fd10965aa1108"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" DROP CONSTRAINT "FK_1e3d5b8107581eff2dcce6b13ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" DROP CONSTRAINT "FK_7b0a10ce3f3ba6cb18213769813"`,
    );
    await queryRunner.query(`DROP TABLE "sub_section"`);
  }
}
