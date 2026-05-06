import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuoteRequestsTable1767000000000
  implements MigrationInterface
{
  name = 'CreateQuoteRequestsTable1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for quote request status
    await queryRunner.query(`
      CREATE TYPE "public"."quote_requests_status_enum" AS ENUM (
        'Pending',
        'Reviewing',
        'Quoted',
        'Accepted',
        'Rejected',
        'Expired',
        'Cancelled'
      )
    `);

    // Create quote_requests table
    await queryRunner.query(`
      CREATE TABLE "quote_requests" (
        "id" SERIAL PRIMARY KEY,
        "quote_number" varchar(50) NOT NULL UNIQUE,
        "customer_id" integer NOT NULL,
        "seller_id" integer NOT NULL,
        "service_id" integer NOT NULL,
        "package_id" integer,
        "status" "public"."quote_requests_status_enum" NOT NULL DEFAULT 'Pending',
        "description" text,
        "special_requirements" text,
        "quantity" integer DEFAULT 1,
        "preferred_date" date,
        "preferred_time" time,
        "service_address_id" integer,
        "service_address_text" varchar(500),
        "service_latitude" decimal(10,8),
        "service_longitude" decimal(11,8),
        "quoted_price" decimal(12,2),
        "currency_id" integer,
        "seller_response" text,
        "quote_breakdown" jsonb,
        "estimated_duration_minutes" integer,
        "quoted_at" timestamptz,
        "quote_expires_at" timestamptz,
        "customer_response" text,
        "responded_at" timestamptz,
        "booking_id" integer,
        "created_by_id" integer,
        "updated_by_id" integer,
        "deleted_by_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "fk_quote_requests_customer" FOREIGN KEY ("customer_id") 
          REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_quote_requests_seller" FOREIGN KEY ("seller_id") 
          REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_quote_requests_service" FOREIGN KEY ("service_id") 
          REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_quote_requests_package" FOREIGN KEY ("package_id") 
          REFERENCES "service_packages"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_quote_requests_currency" FOREIGN KEY ("currency_id") 
          REFERENCES "currencies"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_quote_requests_booking" FOREIGN KEY ("booking_id") 
          REFERENCES "bookings"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_quote_requests_created_by" FOREIGN KEY ("created_by_id") 
          REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_quote_requests_updated_by" FOREIGN KEY ("updated_by_id") 
          REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_quote_requests_deleted_by" FOREIGN KEY ("deleted_by_id") 
          REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_quote_number" ON "quote_requests" ("quote_number")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_customer_id" ON "quote_requests" ("customer_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_seller_id" ON "quote_requests" ("seller_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_service_id" ON "quote_requests" ("service_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_status" ON "quote_requests" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_created_at" ON "quote_requests" ("created_at")
    `);

    // Add notification types for quotes if they don't exist
    // This is safe to run even if the types already exist
    console.log(
      'Note: You may need to add these notification types to your NotificationTypeEnum:',
    );
    console.log('  - QUOTE_REQUESTED');
    console.log('  - QUOTE_RECEIVED');
    console.log('  - QUOTE_ACCEPTED');
    console.log('  - QUOTE_REJECTED');
    console.log('  - QUOTE_EXPIRED');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quote_requests_created_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quote_requests_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quote_requests_service_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quote_requests_seller_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quote_requests_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quote_requests_quote_number"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "quote_requests"`);

    // Drop enum
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."quote_requests_status_enum"`,
    );
  }
}
