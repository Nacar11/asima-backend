import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsMembersOnlyToEdistricts1776100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "edistricts" ADD COLUMN "is_members_only" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "edistricts" DROP COLUMN "is_members_only"`,
    );
  }
}
