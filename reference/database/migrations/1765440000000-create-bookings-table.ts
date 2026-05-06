import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create bookings table.
 *
 * This migration creates the bookings table for service bookings
 * that are created from checkout orders. The table tracks booking
 * status, scheduling, location, pricing, and completion.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateBookingsTable1765440000000 implements MigrationInterface {
  name = 'CreateBookingsTable1765440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "booking_status_enum" AS ENUM(
          'pending',
          'confirmed',
          'provider_assigned',
          'in_progress',
          'paused',
          'pending_review',
          'completed',
          'cancelled',
          'disputed'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" SERIAL PRIMARY KEY,
        "checkout_order_id" integer NOT NULL,
        "seller_id" integer NOT NULL,
        "service_id" integer NOT NULL,
        "package_id" integer,
        
        -- From bundle?
        "bundle_id" integer,
        
        -- Booking Number
        "booking_number" varchar(50) NOT NULL UNIQUE,
        
        -- Assigned Member (for sellers with multiple members)
        "assigned_member_id" integer,
        
        -- Customer
        "customer_id" integer NOT NULL,
        
        -- Schedule
        "scheduled_date" date NOT NULL,
        "scheduled_start_time" time NOT NULL,
        "scheduled_end_time" time,
        "actual_start_time" timestamp,
        "actual_end_time" timestamp,
        
        -- Location
        "service_address_id" integer,
        "service_address_text" text,
        "service_latitude" numeric(10,8),
        "service_longitude" numeric(11,8),
        
        -- Pricing
        "subtotal" numeric(12,2) NOT NULL,
        "discount_amount" numeric(10,2) NOT NULL DEFAULT 0,
        "platform_fee" numeric(10,2) NOT NULL DEFAULT 0,
        "platform_fee_percent" numeric(5,2) NOT NULL DEFAULT 0.00,
        "provider_payout" numeric(12,2),
        "total" numeric(12,2) NOT NULL,
        
        -- Status
        "status" "booking_status_enum" NOT NULL DEFAULT 'pending',
        
        -- Notes
        "customer_notes" text,
        "provider_notes" text,
        "internal_notes" text,
        
        -- Cancellation
        "cancelled_at" timestamp,
        "cancelled_by" integer,
        "cancellation_reason" text,
        
        -- Completion
        "completed_at" timestamp,
        
        -- Timestamps
        "confirmed_at" timestamp,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT "FK_bookings_checkout_order_id"
          FOREIGN KEY ("checkout_order_id")
          REFERENCES "checkout_orders"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_seller_id"
          FOREIGN KEY ("seller_id")
          REFERENCES "sellers"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_service_id"
          FOREIGN KEY ("service_id")
          REFERENCES "services"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_package_id"
          FOREIGN KEY ("package_id")
          REFERENCES "service_packages"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_assigned_member_id"
          FOREIGN KEY ("assigned_member_id")
          REFERENCES "seller_members"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_customer_id"
          FOREIGN KEY ("customer_id")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_service_address_id"
          FOREIGN KEY ("service_address_id")
          REFERENCES "user_addresses"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_cancelled_by"
          FOREIGN KEY ("cancelled_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_checkout_order_id"
      ON "bookings" ("checkout_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_seller_id"
      ON "bookings" ("seller_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_service_id"
      ON "bookings" ("service_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_customer_id"
      ON "bookings" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_assigned_member_id"
      ON "bookings" ("assigned_member_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_bookings_booking_number"
      ON "bookings" ("booking_number")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_status"
      ON "bookings" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_scheduled_date"
      ON "bookings" ("scheduled_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_deleted_at"
      ON "bookings" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_deleted_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_scheduled_date"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_booking_number"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_assigned_member_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_customer_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_service_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_seller_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_checkout_order_id"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum"`);
  }
}
