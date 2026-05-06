import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductCountColumns1764569117000
  implements MigrationInterface
{
  name = 'DropProductCountColumns1764569117000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop index and column from categories table
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_categories_product_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "product_count"`,
    );

    // Drop index and column from tags table
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_tags_count"`);
    await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN IF EXISTS "count"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore count column to tags table
    await queryRunner.query(
      `ALTER TABLE "tags" ADD COLUMN "count" bigint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tags_count" ON "tags" ("count")`,
    );

    // Restore product_count column to categories table
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN "product_count" bigint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_product_count" ON "categories" ("product_count")`,
    );
  }
}
