import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReturnRequestsTables1766028100000
  implements MigrationInterface
{
  name = 'CreateReturnRequestsTables1766028100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==================== 1. CREATE RETURN_REQUESTS TABLE ====================
    await queryRunner.query(`
      CREATE TABLE "return_requests" (
        "id" SERIAL NOT NULL,
        "order_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "seller_id" integer,
        "return_number" uuid NOT NULL DEFAULT gen_random_uuid(),
        "status" character varying(30) NOT NULL DEFAULT 'pending',
        "reason" text NOT NULL,
        "rejection_reason" text,
        "approval_notes" text,
        "previous_order_status" character varying(50) NOT NULL,
        "pickup_scheduled_at" TIMESTAMP,
        "pickup_scheduled_date" TIMESTAMP,
        "pickup_scheduled_by" integer,
        "pickup_notes" text,
        "picked_up_at" TIMESTAMP,
        "picked_up_by" integer,
        "calculated_refund_amount" numeric(10,2),
        "actual_refund_amount" numeric(10,2),
        "refund_notes" text,
        "requested_at" TIMESTAMP NOT NULL DEFAULT now(),
        "approved_at" TIMESTAMP,
        "approved_by" integer,
        "rejected_at" TIMESTAMP,
        "rejected_by" integer,
        "received_at" TIMESTAMP,
        "received_by" integer,
        "refunded_at" TIMESTAMP,
        "refunded_by" integer,
        "created_by" integer,
        "updated_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_return_requests_return_number" UNIQUE ("return_number"),
        CONSTRAINT "UQ_return_requests_order_id" UNIQUE ("order_id"),
        CONSTRAINT "PK_return_requests" PRIMARY KEY ("id")
      )
    `);

    // Return requests foreign keys
    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_order_id"
      FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_user_id"
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_seller_id"
      FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_approved_by"
      FOREIGN KEY ("approved_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_rejected_by"
      FOREIGN KEY ("rejected_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_received_by"
      FOREIGN KEY ("received_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_refunded_by"
      FOREIGN KEY ("refunded_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_pickup_scheduled_by"
      FOREIGN KEY ("pickup_scheduled_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_picked_up_by"
      FOREIGN KEY ("picked_up_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_created_by"
      FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_updated_by"
      FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ADD CONSTRAINT "FK_return_requests_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Return requests indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_order_id" ON "return_requests" ("order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_user_id" ON "return_requests" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_seller_id" ON "return_requests" ("seller_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_status" ON "return_requests" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_return_number" ON "return_requests" ("return_number")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_deleted_at" ON "return_requests" ("deleted_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_pickup_scheduled_date" ON "return_requests" ("pickup_scheduled_date")
    `);

    // Composite index for seller queries
    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_seller_status_created" ON "return_requests" ("seller_id", "status", "created_at")
    `);

    // ==================== 2. CREATE RETURN_REQUEST_ITEMS TABLE ====================
    await queryRunner.query(`
      CREATE TABLE "return_request_items" (
        "id" SERIAL NOT NULL,
        "return_request_id" integer NOT NULL,
        "sales_order_item_id" integer NOT NULL,
        "variant_id" integer NOT NULL,
        "quantity_ordered" integer NOT NULL,
        "quantity_returning" integer NOT NULL,
        "unit_price" numeric(10,2) NOT NULL,
        "return_amount" numeric(10,2) NOT NULL,
        "item_status" character varying(20) NOT NULL DEFAULT 'pending',
        "created_by" integer,
        "updated_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_return_request_items_request_order_item" UNIQUE ("return_request_id", "sales_order_item_id"),
        CONSTRAINT "CHK_return_quantity_positive" CHECK ("quantity_returning" > 0),
        CONSTRAINT "CHK_return_quantity_valid" CHECK ("quantity_returning" <= "quantity_ordered"),
        CONSTRAINT "PK_return_request_items" PRIMARY KEY ("id")
      )
    `);

    // Return request items foreign keys
    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "FK_return_request_items_return_request_id"
      FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "FK_return_request_items_sales_order_item_id"
      FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "FK_return_request_items_variant_id"
      FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "FK_return_request_items_created_by"
      FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_request_items"
      ADD CONSTRAINT "FK_return_request_items_updated_by"
      FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Return request items indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_return_request_items_return_request_id" ON "return_request_items" ("return_request_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_request_items_sales_order_item_id" ON "return_request_items" ("sales_order_item_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_request_items_variant_id" ON "return_request_items" ("variant_id")
    `);

    // ==================== 3. CREATE RETURN_REQUEST_MEDIA_MAPPINGS TABLE ====================
    await queryRunner.query(`
      CREATE TABLE "return_request_media_mappings" (
        "id" SERIAL NOT NULL,
        "return_request_id" integer NOT NULL,
        "media_id" integer NOT NULL,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_return_request_media_mappings_request_media" UNIQUE ("return_request_id", "media_id"),
        CONSTRAINT "PK_return_request_media_mappings" PRIMARY KEY ("id")
      )
    `);

    // Media mappings foreign keys
    await queryRunner.query(`
      ALTER TABLE "return_request_media_mappings"
      ADD CONSTRAINT "FK_return_request_media_mappings_return_request_id"
      FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "return_request_media_mappings"
      ADD CONSTRAINT "FK_return_request_media_mappings_media_id"
      FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Media mappings indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_return_request_media_mappings_return_request_id" ON "return_request_media_mappings" ("return_request_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_request_media_mappings_media_id" ON "return_request_media_mappings" ("media_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_return_request_media_mappings_display_order" ON "return_request_media_mappings" ("display_order")
    `);

    // ==================== 4. ADD QUANTITY_RETURNED TO SALES_ORDER_ITEMS ====================
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD COLUMN "quantity_returned" integer NOT NULL DEFAULT 0
    `);

    // Add check constraint to ensure quantity_returned doesn't exceed quantity
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD CONSTRAINT "CHK_quantity_returned_valid" CHECK ("quantity_returned" >= 0 AND "quantity_returned" <= "quantity")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop quantity_returned from sales_order_items
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP CONSTRAINT IF EXISTS "CHK_quantity_returned_valid"
    `);
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      DROP COLUMN IF EXISTS "quantity_returned"
    `);
    // Drop media mappings indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_request_media_mappings_display_order"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_request_media_mappings_media_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_request_media_mappings_return_request_id"`,
    );

    // Drop media mappings table
    await queryRunner.query(
      `DROP TABLE IF EXISTS "return_request_media_mappings"`,
    );

    // Drop return request items indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_request_items_variant_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_request_items_sales_order_item_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_request_items_return_request_id"`,
    );

    // Drop return request items table
    await queryRunner.query(`DROP TABLE IF EXISTS "return_request_items"`);

    // Drop return requests indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_seller_status_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_pickup_scheduled_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_return_number"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_seller_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_return_requests_order_id"`,
    );

    // Drop return requests table
    await queryRunner.query(`DROP TABLE IF EXISTS "return_requests"`);
  }
}
