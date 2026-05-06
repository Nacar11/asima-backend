import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserGroupsDescriptionLength1773043200000
  implements MigrationInterface
{
  name = 'AlterUserGroupsDescriptionLength1773043200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_groups" ALTER COLUMN "description" TYPE varchar(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ALTER COLUMN "description" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_groups" ALTER COLUMN "description" TYPE varchar(255)`,
    );
  }
}
