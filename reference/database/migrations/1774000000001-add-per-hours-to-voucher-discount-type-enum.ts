import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerHoursToVoucherDiscountTypeEnum1774000000001
  implements MigrationInterface
{
  name = 'AddPerHoursToVoucherDiscountTypeEnum1774000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "CHK_vouchers_discount_type_cap_consistency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "discount_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."vouchers_discount_type_enum" RENAME TO "vouchers_discount_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_discount_type_enum" AS ENUM('shipping', 'fixed', 'percentage', 'b1t1', 'per_hours')`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ALTER COLUMN "discount_type" TYPE "public"."vouchers_discount_type_enum"
      USING "discount_type"::text::"public"."vouchers_discount_type_enum"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."vouchers_discount_type_enum_old"`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_discount_type_cap_consistency"
      CHECK (
        ("discount_type" = 'percentage' AND "max_discount_cap" IS NOT NULL) OR
        (
          "discount_type" IN ('shipping', 'fixed', 'b1t1', 'per_hours') AND
          "max_discount_cap" IS NULL
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "CHK_vouchers_discount_type_cap_consistency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "discount_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."vouchers_discount_type_enum" RENAME TO "vouchers_discount_type_enum_new"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_discount_type_enum" AS ENUM('shipping', 'fixed', 'percentage', 'b1t1')`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ALTER COLUMN "discount_type" TYPE "public"."vouchers_discount_type_enum"
      USING (
        CASE
          WHEN "discount_type"::text = 'per_hours' THEN 'fixed'
          ELSE "discount_type"::text
        END
      )::"public"."vouchers_discount_type_enum"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."vouchers_discount_type_enum_new"`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_discount_type_cap_consistency"
      CHECK (
        ("discount_type" = 'percentage' AND "max_discount_cap" IS NOT NULL) OR
        (
          "discount_type" IN ('shipping', 'fixed', 'b1t1') AND
          "max_discount_cap" IS NULL
        )
      )
    `);
  }
}
