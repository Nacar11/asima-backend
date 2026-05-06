import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserPermissionsTable1732805974361
  implements MigrationInterface
{
  name = 'CreateUserPermissionsTable1732805974361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_permissions_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_permissions" ("id" SERIAL NOT NULL, "permissions" json NOT NULL, "status" "public"."user_permissions_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "group_id" integer NOT NULL, "menu_id" integer NOT NULL, "created_by" integer NOT NULL, "updated_by" integer NOT NULL, "deleted_by" integer, CONSTRAINT "PK_01f4295968ba33d73926684264f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_c6b0b96103f5b99e2c8bb8911da" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_a1a7cc3d8a08390e14bb3e6ffa5" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_1b858233a0b25f6cf3bd5b1f2c7" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_f6a87e49076d14415e6b55d4f11" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_ea649aea54e17ce3f288c3ea4be" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_ea649aea54e17ce3f288c3ea4be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_f6a87e49076d14415e6b55d4f11"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_1b858233a0b25f6cf3bd5b1f2c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_a1a7cc3d8a08390e14bb3e6ffa5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_c6b0b96103f5b99e2c8bb8911da"`,
    );
    await queryRunner.query(`DROP TABLE "user_permissions"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_permissions_status_enum"`,
    );
  }
}
