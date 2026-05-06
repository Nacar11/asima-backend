import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddFormSubmissionIdToCartItems
 *
 * Adds form_submission_id column to shopping_cart_items to support
 * linking service requirements (form submissions) to cart items for
 * reactive bookings. This enables passing form_submission_id through
 * the checkout flow to the booking creation.
 *
 * @since 1.0.0
 */
export class AddFormSubmissionIdToCartItems1770300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add form_submission_id column
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD COLUMN IF NOT EXISTS "form_submission_id" integer NULL
    `);

    // Add foreign key constraint for form_submission_id
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD CONSTRAINT "FK_shopping_cart_items_form_submission_id"
      FOREIGN KEY ("form_submission_id")
      REFERENCES "form_submissions"("id")
      ON DELETE SET NULL
    `);

    // Add index for form_submission_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_shopping_cart_items_form_submission_id"
      ON "shopping_cart_items" ("form_submission_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_shopping_cart_items_form_submission_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shopping_cart_items" DROP CONSTRAINT IF EXISTS "FK_shopping_cart_items_form_submission_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shopping_cart_items" DROP COLUMN IF EXISTS "form_submission_id"`,
    );
  }
}
