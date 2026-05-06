import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotNullCompanyTable1757909129875 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "company_name" SET NOT NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "short_name" SET NOT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "company_name" DROP NOT NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "short_name" DROP NOT NULL;`,
    );
  }
}
