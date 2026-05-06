import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropVoucherRedemptionHasReferenceConstraint1775900000000
  implements MigrationInterface
{
  name = 'DropVoucherRedemptionHasReferenceConstraint1775900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The original constraint required at least one of sales_order_id or booking_id
    // to be non-null. This breaks onsite QR scan redemptions which intentionally have
    // both null (identified only by seller_id).
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" DROP CONSTRAINT IF EXISTS "CHK_voucher_redemptions_has_reference"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Only restore the constraint for rows that already satisfy it
    // (onsite QR redemptions will violate it, so this is best-effort)
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "CHK_voucher_redemptions_has_reference" CHECK (num_nonnulls("sales_order_id", "booking_id") >= 1)`,
    );
  }
}
