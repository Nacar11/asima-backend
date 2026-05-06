import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerIdToVoucherRedemptions1774000000000
  implements MigrationInterface
{
  name = 'AddSellerIdToVoucherRedemptions1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add seller_id to voucher_redemptions
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ADD "seller_id" integer NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "FK_voucher_redemptions_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_voucher_redemptions_seller_id" ON "voucher_redemptions" ("seller_id")`,
    );

    // 2. Update vouchers scope-seller constraint to allow admin (seller_id IS NULL)
    //    to create vouchers with service-categories and services scopes
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "CHK_vouchers_scope_seller_consistency"`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_scope_seller_consistency"
      CHECK (
        ("seller_id" IS NULL AND "scope" IN ('global', 'categories', 'services', 'service-categories')) OR
        (
          "seller_id" IS NOT NULL AND
          "scope" IN ('categories', 'products', 'service-categories', 'services')
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert vouchers scope-seller constraint
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "CHK_vouchers_scope_seller_consistency"`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_scope_seller_consistency"
      CHECK (
        ("seller_id" IS NULL AND "scope" IN ('global', 'categories')) OR
        (
          "seller_id" IS NOT NULL AND
          "scope" IN ('categories', 'products', 'service-categories', 'services')
        )
      )
    `);

    // Revert seller_id on voucher_redemptions
    await queryRunner.query(`DROP INDEX "IDX_voucher_redemptions_seller_id"`);
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" DROP CONSTRAINT "FK_voucher_redemptions_seller_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "voucher_redemptions" DROP COLUMN "seller_id"`,
    );
  }
}
