import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create sales_orders table.
 *
 * This migration creates the sales_orders table that stores customer orders.
 * Orders are created from shopping cart checkout and track order status,
 * totals, and customer notes.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateSalesOrdersTable1764071500000 implements MigrationInterface {
  name = 'CreateSalesOrdersTable1764071500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales_orders" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "order_number" character varying(50) NOT NULL UNIQUE,
        "idempotency_key" UUID,
        "status" character varying NOT NULL DEFAULT 'pending',
        "subtotal" numeric(10,2) NOT NULL,
        "tax_amount" numeric(10,2) DEFAULT 0,
        "shipping_amount" numeric(10,2) DEFAULT 0,
        "total_amount" numeric(10,2) NOT NULL,
        "notes" text,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "FK_sales_orders_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_orders_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_orders_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_orders_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "CHK_sales_orders_amounts_non_negative"
          CHECK (
            "subtotal" >= 0 AND
            "tax_amount" >= 0 AND
            "shipping_amount" >= 0 AND
            "total_amount" >= 0
          )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_sales_orders_order_number"
      ON "sales_orders" ("order_number")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_orders_user_id"
      ON "sales_orders" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_orders_status"
      ON "sales_orders" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_orders_created_at"
      ON "sales_orders" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_orders_deleted_at"
      ON "sales_orders" ("deleted_at")
    `);

    // Unique partial index for idempotency key per user (only for non-null values)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_sales_orders_user_idempotency_key"
      ON "sales_orders" ("user_id", "idempotency_key")
      WHERE "idempotency_key" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_sales_orders_user_idempotency_key"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_sales_orders_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_orders_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_orders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_orders_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_orders_order_number"`);
    await queryRunner.query(`DROP TABLE "sales_orders"`);
  }
}
