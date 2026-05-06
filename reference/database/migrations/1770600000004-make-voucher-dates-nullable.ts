import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeVoucherDatesNullable1770600000004
  implements MigrationInterface
{
  name = 'MakeVoucherDatesNullable1770600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing date range check constraint
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT IF EXISTS "CHK_vouchers_date_range"`,
    );

    // Make starts_at nullable
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "starts_at" DROP NOT NULL`,
    );

    // Make expires_at nullable
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "expires_at" DROP NOT NULL`,
    );

    // Re-add the check constraint allowing NULLs:
    // Both must be set together and starts_at <= expires_at, or both can be NULL
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD CONSTRAINT "CHK_vouchers_date_range" CHECK (
        ("starts_at" IS NULL AND "expires_at" IS NULL)
        OR ("starts_at" IS NOT NULL AND "expires_at" IS NOT NULL AND "starts_at" <= "expires_at")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the updated check constraint
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT IF EXISTS "CHK_vouchers_date_range"`,
    );

    // Backfill NULLs with sensible defaults before adding NOT NULL
    await queryRunner.query(
      `UPDATE "vouchers" SET "starts_at" = "created_at" WHERE "starts_at" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "vouchers" SET "expires_at" = "created_at" + INTERVAL '1 year' WHERE "expires_at" IS NULL`,
    );

    // Restore NOT NULL constraints
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "starts_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "expires_at" SET NOT NULL`,
    );

    // Restore original check constraint
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD CONSTRAINT "CHK_vouchers_date_range" CHECK ("starts_at" <= "expires_at")`,
    );
  }
}
