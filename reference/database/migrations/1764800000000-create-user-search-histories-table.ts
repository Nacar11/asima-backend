import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create user_search_histories table.
 *
 * This table stores an audit trail of user search keywords.
 * Used for analytics, personalization, trending searches, and search optimization.
 */
export class CreateUserSearchHistoriesTable1764800000000
  implements MigrationInterface
{
  name = 'CreateUserSearchHistoriesTable1764800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_search_histories" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "keyword" character varying(255) NOT NULL,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "FK_user_search_histories_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_search_histories_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_search_histories_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_search_histories_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_search_histories_user_id_created_at"
      ON "user_search_histories" ("user_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_search_histories_deleted_at"
      ON "user_search_histories" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_user_search_histories_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_user_search_histories_user_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "user_search_histories"`);
  }
}
