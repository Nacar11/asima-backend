import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create cancellation_policies and booking_cancellations tables.
 *
 * This migration creates tables for managing booking cancellations
 * and cancellation policies with refund calculations.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateCancellationTables1765510000000
  implements MigrationInterface
{
  name = 'CreateCancellationTables1765510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."cancellation_role_enum" AS ENUM('customer', 'store', 'store_member', 'admin', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cancellation_reason_enum" AS ENUM('schedule_conflict', 'emergency', 'provider_unavailable', 'customer_no_show', 'weather', 'illness', 'changed_mind', 'found_alternative', 'price_disagreement', 'service_unavailable', 'duplicate_booking', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cancellation_policy_enum" AS ENUM('free_cancellation', 'partial_charge', 'full_charge', 'provider_fault', 'admin_override')`,
    );

    // Create cancellation_policies table
    await queryRunner.query(
      `CREATE TABLE "cancellation_policies" (
        "id" SERIAL PRIMARY KEY,
        "seller_id" integer,
        "service_id" integer,
        "name" varchar(100) NOT NULL,
        "description" text,
        "free_cancel_hours" integer NOT NULL DEFAULT 48,
        "partial_cancel_hours" integer NOT NULL DEFAULT 24,
        "partial_cancel_percent" decimal(5,2) NOT NULL DEFAULT 50.00,
        "no_show_charge_percent" decimal(5,2) NOT NULL DEFAULT 100.00,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT "FK_cancellation_policies_seller_id"
          FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cancellation_policies_service_id"
          FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
      )`,
    );

    // Create indexes for cancellation_policies
    await queryRunner.query(
      `CREATE INDEX "IDX_cancellation_policies_seller_id" ON "cancellation_policies" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cancellation_policies_service_id" ON "cancellation_policies" ("service_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cancellation_policies_is_active" ON "cancellation_policies" ("is_active")`,
    );

    // Create booking_cancellations table
    await queryRunner.query(
      `CREATE TABLE "booking_cancellations" (
        "id" SERIAL PRIMARY KEY,
        "booking_id" integer NOT NULL UNIQUE,
        "cancelled_by" integer NOT NULL,
        "cancelled_by_role" "public"."cancellation_role_enum" NOT NULL,
        "reason" "public"."cancellation_reason_enum" NOT NULL,
        "reason_details" text,
        "scheduled_date" date NOT NULL,
        "scheduled_time" time NOT NULL,
        "cancelled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "hours_before_scheduled" integer,
        "policy_applied" "public"."cancellation_policy_enum" NOT NULL,
        "cancellation_fee_percent" decimal(5,2),
        "cancellation_fee_amount" decimal(10,2),
        "original_amount" decimal(12,2) NOT NULL,
        "refund_amount" decimal(12,2) NOT NULL,
        "store_compensation" decimal(12,2) NOT NULL DEFAULT 0,
        "platform_fee_refunded" decimal(10,2) NOT NULL DEFAULT 0,
        "escrow_refunded" decimal(12,2) NOT NULL DEFAULT 0,
        "escrow_released_to_store" decimal(12,2) NOT NULL DEFAULT 0,
        "refund_id" integer,
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "internal_notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "deleted_by" integer,
        
        CONSTRAINT "FK_booking_cancellations_booking_id"
          FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_booking_cancellations_cancelled_by"
          FOREIGN KEY ("cancelled_by") REFERENCES "user"("id") ON DELETE RESTRICT
      )`,
    );

    // Create indexes for booking_cancellations
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_cancellations_booking_id" ON "booking_cancellations" ("booking_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_cancellations_cancelled_by" ON "booking_cancellations" ("cancelled_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_cancellations_cancelled_by_role" ON "booking_cancellations" ("cancelled_by_role")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_cancellations_policy_applied" ON "booking_cancellations" ("policy_applied")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_cancellations_created_at" ON "booking_cancellations" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "IDX_booking_cancellations_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_booking_cancellations_policy_applied"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_booking_cancellations_cancelled_by_role"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_booking_cancellations_cancelled_by"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_booking_cancellations_booking_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_cancellation_policies_is_active"`);
    await queryRunner.query(
      `DROP INDEX "IDX_cancellation_policies_service_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_cancellation_policies_seller_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "booking_cancellations"`);
    await queryRunner.query(`DROP TABLE "cancellation_policies"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."cancellation_policy_enum"`);
    await queryRunner.query(`DROP TYPE "public"."cancellation_reason_enum"`);
    await queryRunner.query(`DROP TYPE "public"."cancellation_role_enum"`);
  }
}
