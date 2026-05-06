import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersTable1733192329972 implements MigrationInterface {
  name = 'AlterUsersTable1733192329972';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_fb2e442d14add3cefbdf33c4561"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_8211d6dd781e2b9e8f887970a41"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ceff942006e320f626107bad7e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab39a297836538a15b12f3ad94"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role_id"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "provider"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "cost_center_code"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id_number"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "suffix"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "user_id" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "salt" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "system_admin" boolean NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "image" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "cost_center" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "first_name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "last_name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "email" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "status" "public"."user_status_enum" NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_758b8ce7c18b9d347461b30228" ON "user" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2" FOREIGN KEY ("cost_center") REFERENCES "cost_center"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_758b8ce7c18b9d347461b30228"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "status" character NOT NULL DEFAULT 'N'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "email" character varying`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "last_name" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "first_name" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "cost_center"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "image"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "system_admin"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "salt"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "suffix" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "id_number" character varying(25)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "cost_center_code" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "provider" character varying NOT NULL DEFAULT 'email'`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "role_id" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ab39a297836538a15b12f3ad94" ON "user" ("suffix") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ceff942006e320f626107bad7e" ON "user" ("id_number") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_8211d6dd781e2b9e8f887970a41" FOREIGN KEY ("cost_center_code") REFERENCES "cost_center"("cost_center_code") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_fb2e442d14add3cefbdf33c4561" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
