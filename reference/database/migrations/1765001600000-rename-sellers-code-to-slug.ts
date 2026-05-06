import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSellersCodeToSlug1765001600000
  implements MigrationInterface
{
  name = 'RenameSellersCodeToSlug1765001600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old unique index on code, then rename the column and recreate the index
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sellers_code"`);
    await queryRunner.query(
      `ALTER TABLE "sellers" RENAME COLUMN "code" TO "slug"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sellers_slug" ON "sellers" ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sellers_slug"`);
    await queryRunner.query(
      `ALTER TABLE "sellers" RENAME COLUMN "slug" TO "code"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sellers_code" ON "sellers" ("code")`,
    );
  }
}
