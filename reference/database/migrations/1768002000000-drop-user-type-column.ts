import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserTypeColumn1768002000000 implements MigrationInterface {
  name = 'DropUserTypeColumn1768002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_user_user_type"`);

    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "user_type"
    `);

    await queryRunner.query(`DROP TYPE "public"."user_user_type_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."user_user_type_enum" AS ENUM('super_admin', 'store_owner', 'store_member', 'customer')
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "user_type" "public"."user_user_type_enum" NOT NULL DEFAULT 'customer'
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_user_user_type" ON "user" ("user_type")`,
    );
  }
}
