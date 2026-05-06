import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterServiceCategoriesCode1765001400000
  implements MigrationInterface
{
  name = 'AlterServiceCategoriesCode1765001400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_categories" ADD "code" varchar(100)`,
    );
    await queryRunner.query(`UPDATE "service_categories" SET "code" = "slug"`);
    await queryRunner.query(
      `ALTER TABLE "service_categories" ALTER COLUMN "code" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" ADD CONSTRAINT "UQ_service_categories_code" UNIQUE ("code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" DROP CONSTRAINT "UQ_service_categories_slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" DROP COLUMN "slug"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_categories" ADD "slug" varchar(100)`,
    );
    await queryRunner.query(`UPDATE "service_categories" SET "slug" = "code"`);
    await queryRunner.query(
      `ALTER TABLE "service_categories" ALTER COLUMN "slug" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" ADD CONSTRAINT "UQ_service_categories_slug" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" DROP CONSTRAINT "UQ_service_categories_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" DROP COLUMN "code"`,
    );
  }
}
