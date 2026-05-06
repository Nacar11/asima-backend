import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create shopping_cart_items table.
 *
 * This migration creates the shopping_cart_items table with relationships
 * to shopping_carts and product_variants. Each cart can have multiple items,
 * and each item references a specific product variant.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateShoppingCartItemsTable1763971500000
  implements MigrationInterface
{
  name = 'CreateShoppingCartItemsTable1763971500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shopping_cart_items" (
        "id" SERIAL PRIMARY KEY,
        "shopping_cart_id" integer NOT NULL,
        "variant_id" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "is_selected" boolean NOT NULL DEFAULT false,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "FK_shopping_cart_items_shopping_cart_id"
          FOREIGN KEY ("shopping_cart_id")
          REFERENCES "shopping_carts"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shopping_cart_items_variant_id"
          FOREIGN KEY ("variant_id")
          REFERENCES "product_variants"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shopping_cart_items_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shopping_cart_items_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shopping_cart_items_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "CHK_shopping_cart_items_quantity_positive"
          CHECK ("quantity" > 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_shopping_cart_items_shopping_cart_id"
      ON "shopping_cart_items" ("shopping_cart_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_shopping_cart_items_variant_id"
      ON "shopping_cart_items" ("variant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_shopping_cart_items_deleted_at"
      ON "shopping_cart_items" ("deleted_at")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_shopping_cart_items_cart_variant_unique"
      ON "shopping_cart_items" ("shopping_cart_id", "variant_id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_shopping_cart_items_cart_variant_unique"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_shopping_cart_items_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_shopping_cart_items_variant_id"`);
    await queryRunner.query(
      `DROP INDEX "IDX_shopping_cart_items_shopping_cart_id"`,
    );
    await queryRunner.query(`DROP TABLE "shopping_cart_items"`);
  }
}
