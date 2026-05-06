import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryStocksTable1763000000009
  implements MigrationInterface
{
  name = 'CreateInventoryStocksTable1763000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "inventory_stocks" ("id" SERIAL NOT NULL, "variant_id" integer NOT NULL, "stock_on_hand" integer NOT NULL DEFAULT '0', "stock_quantity" integer NOT NULL DEFAULT '0', "reserved_quantity" integer NOT NULL DEFAULT '0', "available_quantity" integer NOT NULL DEFAULT '0', "min_stock_level" integer DEFAULT '0', "last_counted_at" TIMESTAMP, "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_inventory_stocks_variant_id" UNIQUE ("variant_id"), CONSTRAINT "PK_inventory_stocks_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_inventory_stocks_variant_id" ON "inventory_stocks" ("variant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_inventory_stocks_stock_quantity" ON "inventory_stocks" ("stock_quantity")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_inventory_stocks_available_quantity" ON "inventory_stocks" ("available_quantity")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_inventory_stocks_stock_on_hand" ON "inventory_stocks" ("stock_on_hand")`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stocks" ADD CONSTRAINT "FK_inventory_stocks_variant_id_product_variants" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory_stocks" DROP CONSTRAINT "FK_inventory_stocks_variant_id_product_variants"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_inventory_stocks_stock_on_hand"`);
    await queryRunner.query(
      `DROP INDEX "IDX_inventory_stocks_available_quantity"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_inventory_stocks_stock_quantity"`);
    await queryRunner.query(`DROP INDEX "IDX_inventory_stocks_variant_id"`);
    await queryRunner.query(`DROP TABLE "inventory_stocks"`);
  }
}
