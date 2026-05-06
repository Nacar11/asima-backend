import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create shopping_carts table.
 *
 * This migration creates the shopping_carts table with a one-to-one relationship
 * with the users table. Each user can have only one shopping cart.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateShoppingCartsTable1763971400000
  implements MigrationInterface
{
  name = 'CreateShoppingCartsTable1763971400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shopping_carts" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL UNIQUE,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "FK_shopping_carts_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shopping_carts_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shopping_carts_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shopping_carts_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_shopping_carts_user_id"
      ON "shopping_carts" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_shopping_carts_deleted_at"
      ON "shopping_carts" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_shopping_carts_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_shopping_carts_user_id"`);
    await queryRunner.query(`DROP TABLE "shopping_carts"`);
  }
}
