import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaToCategoriesTable1764800000000
  implements MigrationInterface
{
  name = 'AddMediaToCategoriesTable1764800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "media_id" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_media_id" ON "categories" ("media_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_media_id" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_media_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_categories_media_id"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "media_id"`);
  }
}
