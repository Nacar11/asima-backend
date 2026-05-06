import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesOrderItemOptionsTable1768000600000
  implements MigrationInterface
{
  name = 'CreateSalesOrderItemOptionsTable1768000600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales_order_item_options" (
        "id" SERIAL NOT NULL,
        "sales_order_item_id" integer NOT NULL,
        "option_group_id" integer,
        "option_value_id" integer,
        "group_name" character varying(255) NOT NULL,
        "group_code" character varying(100) NOT NULL,
        "value_label" character varying(255) NOT NULL,
        "value_code" character varying(100) NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "price_adjustment" numeric(12,2) NOT NULL DEFAULT 0,
        "duration_adjustment_minutes" integer NOT NULL DEFAULT 0,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_order_item_options_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_soi_options_sales_order_item" FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_soi_options_option_group" FOREIGN KEY ("option_group_id") REFERENCES "service_option_groups"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_soi_options_option_value" FOREIGN KEY ("option_value_id") REFERENCES "service_option_values"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_soi_options_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_soi_options_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_soi_options_sales_order_item_id" ON "sales_order_item_options" ("sales_order_item_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_soi_options_item_group" ON "sales_order_item_options" ("sales_order_item_id", "option_group_id") WHERE "option_group_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_soi_options_item_group"`);
    await queryRunner.query(`DROP INDEX "IDX_soi_options_sales_order_item_id"`);
    await queryRunner.query(`DROP TABLE "sales_order_item_options"`);
  }
}
