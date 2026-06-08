import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1778084598000 implements MigrationInterface {
  name = 'CreateUsersTable1778084598000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "title" character varying(100),
        "role_id" integer NOT NULL,
        "system_admin" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    /*
     * Case-insensitive email uniqueness that excludes soft-deleted rows.
     * A plain column UNIQUE would treat 'Jane@…' and 'jane@…' as distinct
     * and would also block re-creating a soft-deleted email. The
     * repository's `LOWER(u.email) = LOWER(:email)` reads hit this index.
     */
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" (LOWER("email")) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_users_role_id" ON "users" ("role_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_is_active" ON "users" ("is_active")`);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_role_id"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_role_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_is_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_role_id"`);
    await queryRunner.query(`DROP INDEX "public"."users_email_lower_uq"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
