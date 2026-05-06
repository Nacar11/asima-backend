import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToServiceCategories1765534150000
  implements MigrationInterface
{
  name = 'AddStatusToServiceCategories1765534150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_categories" ADD "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_categories_status" ON "service_categories" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_categories_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" DROP COLUMN "status"`,
    );
  }
}
