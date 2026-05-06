import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCompanyAddLogo1757491416085 implements MigrationInterface {
  name = 'AlterCompanyAddLogo1757491416085';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" ADD "logo" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "logo"`);
  }
}
