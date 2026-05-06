import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterServicesCode1765001500000 implements MigrationInterface {
  name = 'AlterServicesCode1765001500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "services" ADD "code" varchar(255)`);
    await queryRunner.query(`UPDATE "services" SET "code" = "slug"`);
    await queryRunner.query(
      `ALTER TABLE "services" ALTER COLUMN "code" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "UQ_services_code" UNIQUE ("code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "UQ_services_slug"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "slug"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "services" ADD "slug" varchar(255)`);
    await queryRunner.query(`UPDATE "services" SET "slug" = "code"`);
    await queryRunner.query(
      `ALTER TABLE "services" ALTER COLUMN "slug" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "UQ_services_slug" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "UQ_services_code"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "code"`);
  }
}
