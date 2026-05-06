import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsGuestToUser1772000000000 implements MigrationInterface {
  name = 'AddIsGuestToUser1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "is_guest" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "salt" DROP NOT NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_user_is_guest" ON "user" ("is_guest")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_is_guest"`);

    await queryRunner.query(
      `UPDATE "user" SET "password" = '' WHERE "password" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "salt" = '' WHERE "salt" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "salt" SET NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_guest"`);
  }
}
