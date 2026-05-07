import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionsTable1778030363182 implements MigrationInterface {
  name = 'CreatePermissionsTable1778030363182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" SERIAL NOT NULL,
        "code" character varying(100) NOT NULL,
        "resource" character varying(50) NOT NULL,
        "action" character varying(30) NOT NULL,
        "description" character varying(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_permissions_code" UNIQUE ("code"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_permissions_code" ON "permissions" ("code")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_permissions_resource" ON "permissions" ("resource")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_permissions_resource"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_permissions_code"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
