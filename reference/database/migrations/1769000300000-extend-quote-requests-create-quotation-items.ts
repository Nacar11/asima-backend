import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Extend quote_requests for DPO and create quotation_items table.
 *
 * Adds fields to quote_requests for post-assessment quotations and revision tracking.
 * Creates quotation_items table for itemized quotation line items.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export class ExtendQuoteRequestsCreateQuotationItems1769000300000
  implements MigrationInterface
{
  name = 'ExtendQuoteRequestsCreateQuotationItems1769000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "quote_type_enum" AS ENUM ('pre_booking', 'post_assessment')
    `);

    await queryRunner.query(`
      CREATE TYPE "quotation_item_type_enum" AS ENUM ('service', 'material')
    `);

    // ==================== Extend quote_requests ====================

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD COLUMN "quote_type" "quote_type_enum" NOT NULL DEFAULT 'pre_booking'
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD COLUMN "assessment_booking_id" INTEGER
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD COLUMN "result_sales_order_id" INTEGER
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD COLUMN "parent_quotation_id" INTEGER
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD COLUMN "revision_number" INTEGER NOT NULL DEFAULT 0
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD CONSTRAINT "FK_quote_requests_assessment_booking_id"
      FOREIGN KEY ("assessment_booking_id") REFERENCES "bookings"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD CONSTRAINT "FK_quote_requests_result_sales_order_id"
      FOREIGN KEY ("result_sales_order_id") REFERENCES "sales_orders"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD CONSTRAINT "FK_quote_requests_parent_quotation_id"
      FOREIGN KEY ("parent_quotation_id") REFERENCES "quote_requests"("id")
      ON DELETE SET NULL
    `);

    // ==================== Create quotation_items table ====================

    await queryRunner.query(`
      CREATE TABLE "quotation_items" (
        "id" SERIAL PRIMARY KEY,
        "quotation_id" INTEGER NOT NULL,
        "item_type" "quotation_item_type_enum" NOT NULL,
        "service_id" INTEGER,
        "product_id" INTEGER,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "unit_type" VARCHAR(50),
        "unit_price" DECIMAL(12,2) NOT NULL,
        "total_price" DECIMAL(12,2) NOT NULL,
        "suggested_schedule_date" DATE,
        "sequence_order" INTEGER,
        "created_by" INTEGER,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_by" INTEGER,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_by" INTEGER,
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "FK_quotation_items_quotation_id"
          FOREIGN KEY ("quotation_id") REFERENCES "quote_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quotation_items_service_id"
          FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_quotation_items_product_id"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL
      )
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_quotation_items_quotation_id" ON "quotation_items" ("quotation_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quotation_items_item_type" ON "quotation_items" ("item_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_quote_type" ON "quote_requests" ("quote_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_assessment_booking_id" ON "quote_requests" ("assessment_booking_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "IDX_quote_requests_assessment_booking_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_quote_requests_quote_type"`);
    await queryRunner.query(`DROP INDEX "IDX_quotation_items_item_type"`);
    await queryRunner.query(`DROP INDEX "IDX_quotation_items_quotation_id"`);

    // Drop quotation_items table
    await queryRunner.query(`DROP TABLE "quotation_items"`);

    // Drop quote_requests foreign keys
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP CONSTRAINT "FK_quote_requests_parent_quotation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP CONSTRAINT "FK_quote_requests_result_sales_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP CONSTRAINT "FK_quote_requests_assessment_booking_id"`,
    );

    // Drop quote_requests columns
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP COLUMN "revision_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP COLUMN "parent_quotation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP COLUMN "result_sales_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP COLUMN "assessment_booking_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP COLUMN "quote_type"`,
    );

    // Drop enum types
    await queryRunner.query(`DROP TYPE "quotation_item_type_enum"`);
    await queryRunner.query(`DROP TYPE "quote_type_enum"`);
  }
}
