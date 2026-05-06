import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewCostCenterTable1731850990136
  implements MigrationInterface
{
  name = 'CreateNewCostCenterTable1731850990136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cost_center" CASCADE;`);
    await queryRunner.query(
      `CREATE TABLE "cost_center" ("id" SERIAL NOT NULL, "cost_center_code" varchar(12) NOT NULL, "division" character(2)  NOT NULL, "department" character(2), "section" character(2), "sub_section" character(2), "remarks" text, "cost_center_status" character(1) NOT NULL, "created_by" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" integer NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_by" integer, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_1e0ebe27517a98d7ecc44d49ffd" UNIQUE ("cost_center_code"), CONSTRAINT "PK_afb130358c8b2c5bf439a6779a9" PRIMARY KEY ("id", "cost_center_code"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_24ed68181c8cc33d57bac5f7e75" FOREIGN KEY ("division") REFERENCES "division"("division_code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_131a477394d54fae792f480006c" FOREIGN KEY ("department") REFERENCES "department"("department_code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_adb7c982cf51c7354b46ea3e85f" FOREIGN KEY ("section") REFERENCES "section"("section_code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_a65ea21d909a68b8620c1d315e3" FOREIGN KEY ("sub_section") REFERENCES "sub_section"("sub_section_code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_9c3792fbdc8eeaf6f11d456bce6" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_db2d5e3b9345440265ae5273533" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_c1c205453040e3e2f438c1d45ed" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_c1c205453040e3e2f438c1d45ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_db2d5e3b9345440265ae5273533"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_9c3792fbdc8eeaf6f11d456bce6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_a65ea21d909a68b8620c1d315e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_adb7c982cf51c7354b46ea3e85f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_131a477394d54fae792f480006c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_24ed68181c8cc33d57bac5f7e75"`,
    );
    await queryRunner.query(`DROP TABLE "cost_center"`);
  }
}
