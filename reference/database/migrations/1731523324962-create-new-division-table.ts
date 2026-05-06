import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewDivisionTable1731523324962 implements MigrationInterface {
  name = 'CreateNewDivisionTable1731523324962';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "division" ("id" SERIAL NOT NULL, "division_code" character(2) NOT NULL, "division_name" character varying(100) NOT NULL, "division_head" integer NOT NULL, "division_status" character(1) NOT NULL, "created_by" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" integer NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_by" integer, "deleted_at" TIMESTAMP, CONSTRAINT "PK_c2d69d7fe3bcea6f84bf0fd6f7b" PRIMARY KEY ("id", "division_code"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" ADD CONSTRAINT "FK_fadf5802bb855237727ae73317a" FOREIGN KEY ("division_head") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" ADD CONSTRAINT "FK_fa775e515506d5f1ac1fdb18546" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" ADD CONSTRAINT "FK_ee6af207930a349efac917adab1" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" ADD CONSTRAINT "FK_1d0f304206829f604ca2b6ea726" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "division" DROP CONSTRAINT "FK_1d0f304206829f604ca2b6ea726"`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" DROP CONSTRAINT "FK_ee6af207930a349efac917adab1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" DROP CONSTRAINT "FK_fa775e515506d5f1ac1fdb18546"`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" DROP CONSTRAINT "FK_fadf5802bb855237727ae73317a"`,
    );

    await queryRunner.query(`DROP TABLE "department"`);
  }
}
