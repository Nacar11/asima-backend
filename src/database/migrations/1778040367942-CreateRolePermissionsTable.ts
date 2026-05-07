import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissionsTable1778040367942 implements MigrationInterface {
  name = 'CreateRolePermissionsTable1778040367942';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" integer NOT NULL,
        "permission_id" integer NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_role_permissions_role_id" ON "role_permissions" ("role_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_role_permissions_permission_id" ON "role_permissions" ("permission_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_role_id"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_permission_id"
      FOREIGN KEY ("permission_id") REFERENCES "permissions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_role_permissions_permission_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_role_permissions_role_id"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
  }
}
