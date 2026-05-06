import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTablesContraints1732867086104 implements MigrationInterface {
  name = 'AlterTablesContraints1732867086104';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_24ed68181c8cc33d57bac5f7e75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" DROP CONSTRAINT "PK_c2d69d7fe3bcea6f84bf0fd6f7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" ADD CONSTRAINT "PK_b6f0d207e38106dbddabab3a078" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_131a477394d54fae792f480006c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "PK_c5a9435842d10adf7b0568cf387"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_adb7c982cf51c7354b46ea3e85f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" DROP CONSTRAINT "PK_c41e49939583a16accc67771955"`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD CONSTRAINT "PK_3c41d2d699384cc5e8eac54777d" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "FK_a65ea21d909a68b8620c1d315e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" DROP CONSTRAINT "PK_dd1754f1efedcce31ddacd89f23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD CONSTRAINT "PK_8bb7e1b5b1460df44eccc43e804" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_8211d6dd781e2b9e8f887970a41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "PK_afb130358c8b2c5bf439a6779a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "PK_814d737123e3a42d0a37e97b393" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "cost_center" DROP COLUMN "division"`);
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "division" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP COLUMN "department"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "department" integer`,
    );
    await queryRunner.query(`ALTER TABLE "cost_center" DROP COLUMN "section"`);
    await queryRunner.query(`ALTER TABLE "cost_center" ADD "section" integer`);
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP COLUMN "sub_section"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "sub_section" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_24ed68181c8cc33d57bac5f7e75" FOREIGN KEY ("division") REFERENCES "division"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_131a477394d54fae792f480006c" FOREIGN KEY ("department") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_adb7c982cf51c7354b46ea3e85f" FOREIGN KEY ("section") REFERENCES "section"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_a65ea21d909a68b8620c1d315e3" FOREIGN KEY ("sub_section") REFERENCES "sub_section"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_8211d6dd781e2b9e8f887970a41" FOREIGN KEY ("cost_center_code") REFERENCES "cost_center"("cost_center_code") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_8211d6dd781e2b9e8f887970a41"`,
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
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP COLUMN "sub_section"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "sub_section" character(2)`,
    );
    await queryRunner.query(`ALTER TABLE "cost_center" DROP COLUMN "section"`);
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "section" character(2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP COLUMN "department"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "department" character(2)`,
    );
    await queryRunner.query(`ALTER TABLE "cost_center" DROP COLUMN "division"`);
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD "division" character(2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" DROP CONSTRAINT "PK_814d737123e3a42d0a37e97b393"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "PK_afb130358c8b2c5bf439a6779a9" PRIMARY KEY ("id", "cost_center_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_8211d6dd781e2b9e8f887970a41" FOREIGN KEY ("cost_center_code") REFERENCES "cost_center"("cost_center_code") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" DROP CONSTRAINT "PK_8bb7e1b5b1460df44eccc43e804"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD CONSTRAINT "PK_dd1754f1efedcce31ddacd89f23" PRIMARY KEY ("id", "sub_section_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_a65ea21d909a68b8620c1d315e3" FOREIGN KEY ("sub_section") REFERENCES "sub_section"("sub_section_code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" DROP CONSTRAINT "PK_3c41d2d699384cc5e8eac54777d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD CONSTRAINT "PK_c41e49939583a16accc67771955" PRIMARY KEY ("id", "section_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_adb7c982cf51c7354b46ea3e85f" FOREIGN KEY ("section") REFERENCES "section"("section_code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "PK_9a2213262c1593bffb581e382f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "PK_c5a9435842d10adf7b0568cf387" PRIMARY KEY ("id", "department_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_131a477394d54fae792f480006c" FOREIGN KEY ("department") REFERENCES "department"("department_code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" DROP CONSTRAINT "PK_b6f0d207e38106dbddabab3a078"`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" ADD CONSTRAINT "PK_c2d69d7fe3bcea6f84bf0fd6f7b" PRIMARY KEY ("id", "division_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_center" ADD CONSTRAINT "FK_24ed68181c8cc33d57bac5f7e75" FOREIGN KEY ("division") REFERENCES "division"("division_code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
