import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create escrow_transactions table.
 *
 * This migration creates the escrow_transactions table for tracking
 * all money movements in/out of escrow for bookings. Supports deposits,
 * releases, refunds, and dispute holds.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateEscrowTransactionsTable1765470000000
  implements MigrationInterface
{
  name = 'CreateEscrowTransactionsTable1765470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for transaction type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "escrow_transaction_type_enum" AS ENUM(
          'deposit',
          'release',
          'refund',
          'dispute_hold',
          'dispute_release'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create escrow_transactions table
    await queryRunner.query(`
      CREATE TABLE "escrow_transactions" (
        "id" SERIAL PRIMARY KEY,
        "booking_id" integer NOT NULL,
        "milestone_id" integer,
        
        -- Transaction Type
        "transaction_type" "escrow_transaction_type_enum" NOT NULL,
        
        -- Amount
        "amount" numeric(12,2) NOT NULL,
        "currency_id" integer,
        
        -- For release transactions
        "released_to" integer,
        -- User ID who receives the release
        "release_method" varchar(50),
        -- bank_transfer, wallet, gcash
        
        -- Status
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        -- pending, processing, completed, failed
        
        -- Reference
        "reference_number" varchar(50),
        "notes" text,
        
        -- Processing
        "processed_by" integer,
        "processed_at" TIMESTAMP WITH TIME ZONE,
        
        -- Audit Fields (BaseEntityHelper)
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT "FK_escrow_transactions_booking_id"
          FOREIGN KEY ("booking_id")
          REFERENCES "bookings"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_escrow_transactions_milestone_id"
          FOREIGN KEY ("milestone_id")
          REFERENCES "booking_milestones"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_escrow_transactions_currency_id"
          FOREIGN KEY ("currency_id")
          REFERENCES "currencies"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_escrow_transactions_released_to"
          FOREIGN KEY ("released_to")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_escrow_transactions_processed_by"
          FOREIGN KEY ("processed_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_escrow_transactions_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_escrow_transactions_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_escrow_transactions_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_transactions_booking_id" 
        ON "escrow_transactions"("booking_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_transactions_milestone_id" 
        ON "escrow_transactions"("milestone_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_transactions_transaction_type" 
        ON "escrow_transactions"("transaction_type");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_transactions_status" 
        ON "escrow_transactions"("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_transactions_deleted_at" 
        ON "escrow_transactions"("deleted_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_escrow_transactions_deleted_at";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_escrow_transactions_status";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_escrow_transactions_transaction_type";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_escrow_transactions_milestone_id";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_escrow_transactions_booking_id";
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "escrow_transactions";`);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "escrow_transaction_type_enum";
    `);
  }
}
