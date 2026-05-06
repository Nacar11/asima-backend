import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserGroupsTable1732776255066 implements MigrationInterface {
  name = 'CreateUserGroupsTable1732776255066';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_groups_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_groups" ("id" SERIAL NOT NULL, "group_name" character varying(50) NOT NULL, "description" character varying(255) NOT NULL, "status" "public"."user_groups_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" integer NOT NULL, "updated_by" integer NOT NULL, "deleted_by" integer, CONSTRAINT "PK_ea7760dc75ee1bf0b09ab9b3289" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ADD CONSTRAINT "FK_c85aededa96027cb5ecbbfcffd9" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ADD CONSTRAINT "FK_f8e2e44acb5c1e47d058fdfe04d" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ADD CONSTRAINT "FK_f8c93e5ec9a88726c5113231ad8" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_groups" DROP CONSTRAINT "FK_f8c93e5ec9a88726c5113231ad8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" DROP CONSTRAINT "FK_f8e2e44acb5c1e47d058fdfe04d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" DROP CONSTRAINT "FK_c85aededa96027cb5ecbbfcffd9"`,
    );
    await queryRunner.query(`DROP TABLE "user_groups"`);
    await queryRunner.query(`DROP TYPE "public"."user_groups_status_enum"`);
  }
}
