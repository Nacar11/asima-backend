import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `refresh_tokens` — the server-side revocation ledger for refresh tokens.
 *
 * See ADR 0002. One row per issued refresh token, keyed by the token's `jti`
 * claim. The row stores NO secret material — the JWT signature proves
 * authenticity; this table only records whether a `jti` is still active.
 *
 * Revocation is a hard `revoked_at` timestamp (not a soft delete). Rotation on
 * `/auth/refresh` atomically revokes the presented `jti` and issues a new row;
 * `/auth/logout` revokes every active row for the user (revoke-all).
 *
 * Audit-column deviation (ADR 0002, intentional): infra rows, not user-authored
 * CRUD — the acting subject IS `user_id`, so `created_by/updated_by/deleted_by`
 * are omitted (mirrors the seed-managed `permissions` exception). FK cascades on
 * user delete so a removed user's sessions vanish with them.
 */
export class CreateRefreshTokensTable1778800000000 implements MigrationInterface {
  name = 'CreateRefreshTokensTable1778800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "jti" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_jti" UNIQUE ("jti")
      )
    `);

    // Active-token lookups + revoke-all are keyed by (user_id, revoked_at).
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_revoked" ON "refresh_tokens" ("user_id", "revoked_at")`,
    );

    // The opportunistic prune on login deletes by expires_at (ADR 0002);
    // without this index every login's sweep would seq-scan the ledger.
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_expires" ON "refresh_tokens" ("expires_at")`,
    );

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "FK_refresh_tokens_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_expires"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_user_revoked"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
