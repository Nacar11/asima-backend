import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoicesTable1766600000000 implements MigrationInterface {
  name = 'CreateInvoicesTable1766600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invoice status enum
    await queryRunner.query(`
      CREATE TYPE "invoice_status_enum" AS ENUM ('valid', 'voided')
    `);

    // Create email status enum
    await queryRunner.query(`
      CREATE TYPE "invoice_email_status_enum" AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced')
    `);

    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" SERIAL NOT NULL,
        "invoice_number" character varying(50) NOT NULL,
        "order_id" integer NOT NULL,
        "seller_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        
        -- Financial Details (snapshot from order)
        "subtotal" decimal(10,2) NOT NULL,
        "tax_amount" decimal(10,2) NOT NULL,
        "shipping_amount" decimal(10,2) NOT NULL,
        "total_amount" decimal(10,2) NOT NULL,
        
        -- Seller Information Snapshot
        "seller_store_name" character varying(255) NOT NULL,
        "seller_business_registration" character varying(100),
        "seller_tax_id" character varying(100),
        
        -- Customer Information Snapshot
        "customer_name" character varying(255) NOT NULL,
        "customer_email" character varying(100) NOT NULL,
        "customer_phone" character varying(20),
        
        -- Shipping Address Snapshot
        "shipping_recipient_name" character varying(255),
        "shipping_address_line1" character varying(255),
        "shipping_address_line2" character varying(255),
        "shipping_city" character varying(100),
        "shipping_state_province" character varying(100),
        "shipping_postal_code" character varying(20),
        "shipping_country" character varying(100),
        
        -- Document Metadata
        "status" "invoice_status_enum" NOT NULL DEFAULT 'valid',
        "pdf_file_path" character varying(500),
        "pdf_generated_at" TIMESTAMP,
        
        -- Email Tracking
        "email_sent_at" TIMESTAMP,
        "email_status" "invoice_email_status_enum" DEFAULT 'pending',
        "email_retry_count" integer NOT NULL DEFAULT 0,
        "last_email_attempt_at" TIMESTAMP,
        
        -- Audit Fields
        "created_by" integer,
        "updated_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_invoice_number" UNIQUE ("invoice_number"),
        CONSTRAINT "UQ_invoices_order_id" UNIQUE ("order_id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_invoices_seller_id" ON "invoices" ("seller_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invoices_user_id" ON "invoices" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invoices_status" ON "invoices" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invoices_created_at" ON "invoices" ("created_at")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD CONSTRAINT "FK_invoices_order_id" 
      FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD CONSTRAINT "FK_invoices_seller_id" 
      FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD CONSTRAINT "FK_invoices_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD CONSTRAINT "FK_invoices_created_by" 
      FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD CONSTRAINT "FK_invoices_updated_by" 
      FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL
    `);

    // Create sequence for invoice numbers (per month)
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop sequence
    await queryRunner.query(`DROP SEQUENCE IF EXISTS invoice_number_seq`);

    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_updated_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_created_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_seller_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_order_id"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_seller_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_email_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status_enum"`);
  }
}
