import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactEmailWebsiteToSellers1769300000000
  implements MigrationInterface
{
  name = 'AddContactEmailWebsiteToSellers1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD "contact" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD "email" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" ADD "website" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "website"`);
    await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "contact"`);
  }
}
