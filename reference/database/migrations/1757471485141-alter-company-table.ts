import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCompanyTable1757471485141 implements MigrationInterface {
  name = 'AlterCompanyTable1757471485141';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "name"`);

    await queryRunner.query(
      `ALTER TABLE "company" ADD "company_name" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "short_name" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "company_description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "tin" character varying(15)`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "date_of_establishment" TIMESTAMP WITH TIME ZONE `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "date_of_establishment"`,
    );
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "tin"`);
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "company_description"`,
    );
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "short_name"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "company_name"`);

    await queryRunner.query(
      `ALTER TABLE "company" ADD "name" character varying(100) NOT NULL`,
    );
  }
}
