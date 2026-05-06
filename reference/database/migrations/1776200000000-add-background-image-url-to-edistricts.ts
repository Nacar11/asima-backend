import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBackgroundImageUrlToEdistricts1776200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "edistricts" ADD COLUMN "background_image_url" varchar(500) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "edistricts" DROP COLUMN "background_image_url"`,
    );
  }
}
