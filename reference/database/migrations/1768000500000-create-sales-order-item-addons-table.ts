import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesOrderItemAddonsTable1768000500000
  implements MigrationInterface
{
  name = 'CreateSalesOrderItemAddonsTable1768000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales_order_item_addons" (
        "id" SERIAL NOT NULL,
        "sales_order_item_id" integer NOT NULL,
        "addon_id" integer,
        "addon_name" character varying(255) NOT NULL,
        "addon_code" character varying(100) NOT NULL,
        "addon_description" text,
        "unit_type" character varying(100),
        "quantity" integer NOT NULL DEFAULT 1,
        "unit_price" numeric(12,2) NOT NULL,
        "total_price" numeric(12,2) NOT NULL,
        "duration_minutes" integer,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_order_item_addons_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_soi_addons_sales_order_item" FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_soi_addons_addon" FOREIGN KEY ("addon_id") REFERENCES "service_addons"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_soi_addons_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_soi_addons_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_soi_addons_sales_order_item_id" ON "sales_order_item_addons" ("sales_order_item_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_soi_addons_addon_id" ON "sales_order_item_addons" ("addon_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_soi_addons_item_addon" ON "sales_order_item_addons" ("sales_order_item_id", "addon_id") WHERE "addon_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_soi_addons_item_addon"`);
    await queryRunner.query(`DROP INDEX "IDX_soi_addons_addon_id"`);
    await queryRunner.query(`DROP INDEX "IDX_soi_addons_sales_order_item_id"`);
    await queryRunner.query(`DROP TABLE "sales_order_item_addons"`);
  }
}
