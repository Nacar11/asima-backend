import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersTable1732159598106 implements MigrationInterface {
  name = 'AlterUsersTable1732159598106';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_892a2061d6a04a7e2efe4c26d6f"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status_id"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "id_number" character varying(25)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "middle_name" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "suffix" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "status" character(1) NOT NULL DEFAULT 'N'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "created_by" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "updated_by" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "deleted_by" integer`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7a4fd2a547828e5efe420e50d1"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "first_name"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "first_name" character varying(100)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6937e802be2946855a3ad0e6be"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "last_name"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "last_name" character varying(100)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ceff942006e320f626107bad7e" ON "user" ("id_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a4fd2a547828e5efe420e50d1" ON "user" ("first_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c93d9f58b8e9a0a3bc4f265662" ON "user" ("middle_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6937e802be2946855a3ad0e6be" ON "user" ("last_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab39a297836538a15b12f3ad94" ON "user" ("suffix") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_d2f5e343630bd8b7e1e7534e82e" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_6bfae5ab9f39212d5b6ad0276b1" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_7dda804b73a73af1c4fcab9a5bc" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_7dda804b73a73af1c4fcab9a5bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_6bfae5ab9f39212d5b6ad0276b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_d2f5e343630bd8b7e1e7534e82e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab39a297836538a15b12f3ad94"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6937e802be2946855a3ad0e6be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c93d9f58b8e9a0a3bc4f265662"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7a4fd2a547828e5efe420e50d1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ceff942006e320f626107bad7e"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "last_name"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "last_name" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6937e802be2946855a3ad0e6be" ON "user" ("last_name") `,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "first_name"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "first_name" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a4fd2a547828e5efe420e50d1" ON "user" ("first_name") `,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updated_by"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "suffix"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "middle_name"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id_number"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "status_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_892a2061d6a04a7e2efe4c26d6f" FOREIGN KEY ("status_id") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
