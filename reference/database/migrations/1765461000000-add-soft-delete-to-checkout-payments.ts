import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add soft delete fields to checkout_payments table.
 *
 * Adds deleted_at and deleted_by columns to support soft delete functionality
 * from BaseEntityHelper.
 *
 * @version 1
 * @since 1.0.0
 */
export class AddSoftDeleteToCheckoutPayments1765461000000
  implements MigrationInterface
{
  name = 'AddSoftDeleteToCheckoutPayments1765461000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deleted_by column
    await queryRunner.query(`
      ALTER TABLE "checkout_payments"
      ADD COLUMN "deleted_by" integer;
    `);

    // Add deleted_at column
    await queryRunner.query(`
      ALTER TABLE "checkout_payments"
      ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE;
    `);

    // Add foreign key constraint for deleted_by
    await queryRunner.query(`
      ALTER TABLE "checkout_payments"
      ADD CONSTRAINT "FK_checkout_payments_deleted_by"
        FOREIGN KEY ("deleted_by")
        REFERENCES "user"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
    `);

    // Add index for deleted_at (for soft delete queries)
    await queryRunner.query(`
      CREATE INDEX "IDX_checkout_payments_deleted_at" 
        ON "checkout_payments"("deleted_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_checkout_payments_deleted_at";
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "checkout_payments"
      DROP CONSTRAINT IF EXISTS "FK_checkout_payments_deleted_by";
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "checkout_payments"
      DROP COLUMN IF EXISTS "deleted_at";
    `);

    await queryRunner.query(`
      ALTER TABLE "checkout_payments"
      DROP COLUMN IF EXISTS "deleted_by";
    `);
  }
}
