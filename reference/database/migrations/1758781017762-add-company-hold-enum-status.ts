import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyHoldEnumStatus1758781017762
  implements MigrationInterface
{
  name = 'AddCompanyHoldEnumStatus1758781017762';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."company_status_enum" RENAME TO "company_status_enum_old";
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."company_status_enum" AS ENUM(
        'Active',
        'Cancelled',
        'New',
        'Hold'
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "company" ALTER COLUMN "status" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "company" 
      ALTER COLUMN "status" TYPE "public"."company_status_enum" 
      USING "status"::text::"public"."company_status_enum";
    `);

    await queryRunner.query(`
      ALTER TABLE "company" ALTER COLUMN "status" SET DEFAULT 'Active';
    `);

    await queryRunner.query(`
      DROP TYPE "public"."company_status_enum_old";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."company_status_enum" RENAME TO "company_status_enum_old";
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."company_status_enum" AS ENUM(
        'Active',
        'Cancelled',
        'New'
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "company" ALTER COLUMN "status" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "company" 
      ALTER COLUMN "status" TYPE "public"."company_status_enum" 
      USING "status"::text::"public"."company_status_enum";
    `);

    await queryRunner.query(`
      ALTER TABLE "company" ALTER COLUMN "status" SET DEFAULT 'Active';
    `);

    await queryRunner.query(`
      DROP TYPE "public"."company_status_enum_old";
    `);
  }
}
