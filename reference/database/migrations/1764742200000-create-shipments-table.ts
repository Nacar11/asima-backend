import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create shipments table.
 *
 * This migration creates the shipments table that stores shipping information
 * for orders. Each order has one shipment record with tracking details and
 * a snapshot of the shipping address.
 *
 * Per the e-commerce address architecture PRD:
 * - user_address_id: Reference to original address (for tracking only)
 * - shipping_* fields: Denormalized snapshot for historical record
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateShipmentsTable1764742200000 implements MigrationInterface {
  name = 'CreateShipmentsTable1764742200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create shipment_status enum
    await queryRunner.query(`
      CREATE TYPE "public"."shipment_status_enum" AS ENUM(
        'preparing',
        'shipped',
        'in_transit',
        'delivered',
        'returned'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "shipments" (
        "id" SERIAL PRIMARY KEY,
        "order_id" integer NOT NULL UNIQUE,
        "user_address_id" integer NOT NULL,
        "tracking_number" character varying(100),
        "carrier" character varying(100),
        "shipping_method" character varying(100),
        "shipping_date" TIMESTAMP WITH TIME ZONE,
        "estimated_delivery" date,
        "actual_delivery" date,
        
        -- Shipping Address Snapshot (denormalized for historical record)
        "shipping_recipient_name" character varying(255) NOT NULL,
        "shipping_phone" character varying(20),
        "shipping_address_line1" character varying(255) NOT NULL,
        "shipping_address_line2" character varying(255),
        "shipping_city" character varying(100) NOT NULL,
        "shipping_state_province" character varying(100) NOT NULL,
        "shipping_postal_code" character varying(20) NOT NULL,
        "shipping_country" character varying(100) NOT NULL,
        
        "shipment_status" "public"."shipment_status_enum" NOT NULL DEFAULT 'preparing',
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT "FK_shipments_order_id"
          FOREIGN KEY ("order_id")
          REFERENCES "sales_orders"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shipments_user_address_id"
          FOREIGN KEY ("user_address_id")
          REFERENCES "user_addresses"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shipments_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shipments_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_shipments_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Index on order_id (unique)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_shipments_order_id"
      ON "shipments" ("order_id")
    `);

    // Index on user_address_id
    await queryRunner.query(`
      CREATE INDEX "idx_shipments_user_address_id"
      ON "shipments" ("user_address_id")
    `);

    // Index on tracking_number
    await queryRunner.query(`
      CREATE INDEX "idx_shipments_tracking_number"
      ON "shipments" ("tracking_number")
    `);

    // Index on shipment_status
    await queryRunner.query(`
      CREATE INDEX "idx_shipments_shipment_status"
      ON "shipments" ("shipment_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_shipments_shipment_status"`);
    await queryRunner.query(`DROP INDEX "idx_shipments_tracking_number"`);
    await queryRunner.query(`DROP INDEX "idx_shipments_user_address_id"`);
    await queryRunner.query(`DROP INDEX "idx_shipments_order_id"`);
    await queryRunner.query(`DROP TABLE "shipments"`);
    await queryRunner.query(`DROP TYPE "public"."shipment_status_enum"`);
  }
}
