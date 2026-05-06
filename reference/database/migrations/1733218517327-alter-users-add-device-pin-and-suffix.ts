import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersAddDevicePinAndSuffix1733218517327
  implements MigrationInterface
{
  name = 'AlterUsersAddDevicePinAndSuffix1733218517327';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "device_pin" character varying(255)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_suffix_enum" AS ENUM('None', 'Jr', 'Sr', 'I', 'II', 'III', 'IV', 'V')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "suffix" "public"."user_suffix_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "suffix"`);
    await queryRunner.query(`DROP TYPE "public"."user_suffix_enum"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "device_pin"`);
  }
}
