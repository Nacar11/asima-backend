import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesOrderQuotationSnapshots1769276448032
  implements MigrationInterface
{
  name = 'CreateSalesOrderQuotationSnapshots1769276448032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the sales_order_quotation_snapshots table
    await queryRunner.query(`
      CREATE TABLE "sales_order_quotation_snapshots" (
        "id" SERIAL NOT NULL,
        "sales_order_id" integer NOT NULL,
        "sales_order_item_id" integer,
        "source_quotation_id" integer NOT NULL,
        "source_quotation_item_id" integer NOT NULL,
        "item_type" character varying(20) NOT NULL,
        "service_id" integer,
        "product_id" integer,
        "name" character varying(255) NOT NULL,
        "description" text,
        "quantity" integer NOT NULL DEFAULT 1,
        "unit_type" character varying(50),
        "unit_price" numeric(12,2) NOT NULL,
        "total_price" numeric(12,2) NOT NULL,
        "scheduled_date" date,
        "scheduled_start_time" time,
        "service_address_id" integer,
        "service_address_text" character varying(500),
        "service_latitude" numeric(10,6),
        "service_longitude" numeric(10,6),
        "sequence_order" integer,
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_sales_order_quotation_snapshots" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "sales_order_quotation_snapshots"
      ADD CONSTRAINT "FK_soqs_sales_order"
      FOREIGN KEY ("sales_order_id")
      REFERENCES "sales_orders"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_quotation_snapshots"
      ADD CONSTRAINT "FK_soqs_sales_order_item"
      FOREIGN KEY ("sales_order_item_id")
      REFERENCES "sales_order_items"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_quotation_snapshots"
      ADD CONSTRAINT "FK_soqs_created_by"
      FOREIGN KEY ("created_by")
      REFERENCES "user"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_quotation_snapshots"
      ADD CONSTRAINT "FK_soqs_updated_by"
      FOREIGN KEY ("updated_by")
      REFERENCES "user"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "sales_order_quotation_snapshots"
      ADD CONSTRAINT "FK_soqs_deleted_by"
      FOREIGN KEY ("deleted_by")
      REFERENCES "user"("id")
    `);

    // Create indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "IDX_soqs_sales_order_id"
      ON "sales_order_quotation_snapshots" ("sales_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_soqs_sales_order_item_id"
      ON "sales_order_quotation_snapshots" ("sales_order_item_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_soqs_source_quotation_id"
      ON "sales_order_quotation_snapshots" ("source_quotation_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_soqs_source_quotation_item_id"
      ON "sales_order_quotation_snapshots" ("source_quotation_item_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_soqs_deleted_at"
      ON "sales_order_quotation_snapshots" ("deleted_at")
    `);

    // Add comment
    await queryRunner.query(`
      COMMENT ON TABLE "sales_order_quotation_snapshots" IS
      'Stores immutable snapshots of quotation items when sales orders are created from quotation checkout'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_soqs_deleted_at"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_soqs_source_quotation_item_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_soqs_source_quotation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_soqs_sales_order_item_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_soqs_sales_order_id"`);

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "sales_order_quotation_snapshots" DROP CONSTRAINT IF EXISTS "FK_soqs_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_quotation_snapshots" DROP CONSTRAINT IF EXISTS "FK_soqs_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_quotation_snapshots" DROP CONSTRAINT IF EXISTS "FK_soqs_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_quotation_snapshots" DROP CONSTRAINT IF EXISTS "FK_soqs_sales_order_item"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_quotation_snapshots" DROP CONSTRAINT IF EXISTS "FK_soqs_sales_order"`,
    );

    // Drop table
    await queryRunner.query(
      `DROP TABLE IF EXISTS "sales_order_quotation_snapshots"`,
    );
  }
}
