import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MEPF Flow Phase 1: Core Schema Changes
 *
 * This migration adds the foundation fields needed for the MEPF (Preventive/Reactive) flow:
 *
 * 1. Services: Add has_checklist flag
 * 2. Bookings: Add AWAITING_QUOTATION status, form_submission_id, recurrence fields
 * 3. Sales Order Items: Add source_quotation_id, source_quotation_item_id
 * 4. Sales Orders: Add source_quotation_id
 *
 * @see /backend/.docs/MEPF/final_flow.md
 * @see /backend/.docs/MEPF/MEPF_flow.md
 */
export class AddMEPFFlowCoreFields1769164189440 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Services: Add has_checklist field
    await queryRunner.query(`
      ALTER TABLE services
      ADD COLUMN IF NOT EXISTS has_checklist BOOLEAN NOT NULL DEFAULT false
    `);

    // 2. Bookings: Add AWAITING_QUOTATION to enum type
    // First check if the value already exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'awaiting_quotation'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status_enum')
        ) THEN
          ALTER TYPE booking_status_enum ADD VALUE 'awaiting_quotation' AFTER 'pending';
        END IF;
      END
      $$;
    `);

    // 3. Bookings: Add new MEPF fields
    await queryRunner.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS form_submission_id INT,
      ADD COLUMN IF NOT EXISTS recurrence_group_id VARCHAR(36),
      ADD COLUMN IF NOT EXISTS recurrence_index INT
    `);

    // 4. Bookings: Add indexes for new fields
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_form_submission_id"
      ON bookings (form_submission_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_recurrence_group_id"
      ON bookings (recurrence_group_id)
    `);

    // 5. Sales Order Items: Add source quotation fields
    await queryRunner.query(`
      ALTER TABLE sales_order_items
      ADD COLUMN IF NOT EXISTS source_quotation_id INT,
      ADD COLUMN IF NOT EXISTS source_quotation_item_id INT
    `);

    // 6. Sales Order Items: Add indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_order_items_source_quotation_id"
      ON sales_order_items (source_quotation_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_order_items_source_quotation_item_id"
      ON sales_order_items (source_quotation_item_id)
    `);

    // 7. Sales Orders: Add source_quotation_id field
    await queryRunner.query(`
      ALTER TABLE sales_orders
      ADD COLUMN IF NOT EXISTS source_quotation_id INT
    `);

    // 8. Sales Orders: Add index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_orders_source_quotation_id"
      ON sales_orders (source_quotation_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_orders_source_quotation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_order_items_source_quotation_item_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_order_items_source_quotation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_recurrence_group_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_form_submission_id"`,
    );

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE sales_orders
      DROP COLUMN IF EXISTS source_quotation_id
    `);

    await queryRunner.query(`
      ALTER TABLE sales_order_items
      DROP COLUMN IF EXISTS source_quotation_item_id,
      DROP COLUMN IF EXISTS source_quotation_id
    `);

    await queryRunner.query(`
      ALTER TABLE bookings
      DROP COLUMN IF EXISTS recurrence_index,
      DROP COLUMN IF EXISTS recurrence_group_id,
      DROP COLUMN IF EXISTS form_submission_id
    `);

    await queryRunner.query(`
      ALTER TABLE services
      DROP COLUMN IF EXISTS has_checklist
    `);

    // Note: Cannot remove enum value 'awaiting_quotation' without recreating the type
    // This is a PostgreSQL limitation. The value will remain but be unused.
  }
}
