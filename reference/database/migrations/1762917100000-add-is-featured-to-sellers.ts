import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsFeaturedToSellers1762917100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD COLUMN "is_featured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sellers_is_featured" ON "sellers" ("is_featured")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_sellers_is_featured"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP COLUMN "is_featured"`,
    );
  }
}
