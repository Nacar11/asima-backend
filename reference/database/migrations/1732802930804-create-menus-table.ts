import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMenusTable1732802930804 implements MigrationInterface {
  name = 'CreateMenusTable1732802930804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."menus_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "menus" ("id" SERIAL NOT NULL, "menu_code" character varying(4) NOT NULL, "menu_name" character varying(50) NOT NULL, "permissions" text array NOT NULL, "status" "public"."menus_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" integer NOT NULL, "updated_by" integer NOT NULL, "deleted_by" integer, CONSTRAINT "PK_3fec3d93327f4538e0cbd4349c4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5cf16ba2df53930b8376f0c67d" ON "menus" ("menu_code") `,
    );
    await queryRunner.query(
      `ALTER TABLE "menus" ADD CONSTRAINT "FK_40114ecec7b4aa6504e77018fd3" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menus" ADD CONSTRAINT "FK_815fafa70adc7f1ea45d9d444a8" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menus" ADD CONSTRAINT "FK_6433b2feefb912eeea148955fd6" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "menus" DROP CONSTRAINT "FK_6433b2feefb912eeea148955fd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menus" DROP CONSTRAINT "FK_815fafa70adc7f1ea45d9d444a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menus" DROP CONSTRAINT "FK_40114ecec7b4aa6504e77018fd3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5cf16ba2df53930b8376f0c67d"`,
    );
    await queryRunner.query(`DROP TABLE "menus"`);
    await queryRunner.query(`DROP TYPE "public"."menus_status_enum"`);
  }
}
