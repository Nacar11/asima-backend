import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create sales_order_items table.
 *
 * This migration creates the sales_order_items table that stores individual
 * line items within an order. Each item references a product variant and
 * captures the price at the time of purchase (price snapshot).
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateSalesOrderItemsTable1764071600000
  implements MigrationInterface
{
  name = 'CreateSalesOrderItemsTable1764071600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales_order_items" (
        "id" SERIAL PRIMARY KEY,
        "order_id" integer NOT NULL,
        "variant_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" numeric(10,2) NOT NULL,
        "total_price" numeric(10,2) NOT NULL,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "FK_sales_order_items_order_id"
          FOREIGN KEY ("order_id")
          REFERENCES "sales_orders"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_order_items_variant_id"
          FOREIGN KEY ("variant_id")
          REFERENCES "product_variants"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_order_items_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_order_items_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_order_items_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "CHK_sales_order_items_quantity_positive"
          CHECK ("quantity" > 0),
        CONSTRAINT "CHK_sales_order_items_prices_non_negative"
          CHECK ("unit_price" >= 0 AND "total_price" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_order_items_order_id"
      ON "sales_order_items" ("order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_order_items_variant_id"
      ON "sales_order_items" ("variant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_order_items_order_variant"
      ON "sales_order_items" ("order_id", "variant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_order_items_deleted_at"
      ON "sales_order_items" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_sales_order_items_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_order_items_order_variant"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_order_items_variant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_order_items_order_id"`);
    await queryRunner.query(`DROP TABLE "sales_order_items"`);
  }
}
