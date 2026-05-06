import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFiletypeEnumForJpg1736768692678 implements MigrationInterface {
  name = 'AddFiletypeEnumForJpg1736768692678';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."attachments_file_type_enum" ADD VALUE IF NOT EXISTS 'JPG'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."attachments_file_type_enum" DROP VALUE IF EXISTS 'JPG'`,
    );
  }
}
