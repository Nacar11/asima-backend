import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewTrackingToSalesOrders1770092106556
  implements MigrationInterface
{
  name = 'AddReviewTrackingToSalesOrders1770092106556';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "review_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "reviewed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "review_id"`,
    );
  }
}
