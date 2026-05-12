import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replace the column-level UNIQUE on `users.email` with a partial
 * functional unique index on `LOWER(email)` that excludes soft-deleted
 * rows.
 *
 * Why:
 *  - The old column UNIQUE treated `'Jane@…'` and `'jane@…'` as
 *    distinct values, so seeds / hand-edits / future migrations could
 *    bypass case-insensitive uniqueness.
 *  - The old UNIQUE also covered soft-deleted rows. Soft-deleting an
 *    email and recreating it raised a raw 500 instead of the friendly
 *    422 the service intends.
 *
 * The repository's `LOWER(u.email) = LOWER(:email)` reads now hit the
 * functional index. See `docs/reviews/module-architecture-improvements.md`
 * (C1, C2).
 */
export class AlterUsersTableAddEmailLowerUniqueIndex1778200000000 implements MigrationInterface {
  name = 'AlterUsersTableAddEmailLowerUniqueIndex1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" (LOWER("email")) WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."users_email_lower_uq"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")`);
  }
}
