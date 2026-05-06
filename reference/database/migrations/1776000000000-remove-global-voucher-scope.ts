import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveGlobalVoucherScope1776000000000
  implements MigrationInterface
{
  name = 'RemoveGlobalVoucherScope1776000000000';

  // Changes in this migration:
  // 1. Remove 'global' from vouchers_scope_enum — admin must now explicitly select eligible items
  // 2. Migrate existing 'global' vouchers to 'categories' scope
  // 3. Recreate CHECK constraint (CHK_vouchers_scope_seller_consistency) without 'global'
  // 4. Add 'include_addons_flag' boolean column (nullable) — controls whether service add-ons are included in discount calculation
  // 5. Recreate IDX_vouchers_code_upper as partial unique index (WHERE deleted_at IS NULL) — allows reuse of voucher codes from soft-deleted vouchers

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop all dependents: default, index, CHECK constraint
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vouchers_scope"`);
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT IF EXISTS "CHK_vouchers_scope_seller_consistency"`,
    );

    // 2. Convert column to text (breaks free from old enum type entirely)
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" TYPE text USING "scope"::text`,
    );

    // 3. Migrate data while it's plain text
    await queryRunner.query(
      `UPDATE "vouchers" SET "scope" = 'categories' WHERE "scope" = 'global'`,
    );

    // 4. Drop old enum, create new one without 'global'
    await queryRunner.query(`DROP TYPE "public"."vouchers_scope_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_scope_enum" AS ENUM('categories', 'products', 'service-categories', 'services')`,
    );

    // 5. Convert column back to the new enum
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" TYPE "public"."vouchers_scope_enum" USING "scope"::"public"."vouchers_scope_enum"`,
    );

    // 6. Restore default, index, and CHECK constraint (without 'global')
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" SET DEFAULT 'categories'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vouchers_scope" ON "vouchers" ("scope")`,
    );
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "CHK_vouchers_scope_seller_consistency"
      CHECK (
        ("seller_id" IS NULL AND "scope" IN ('categories', 'products', 'services', 'service-categories')) OR
        (
          "seller_id" IS NOT NULL AND
          "scope" IN ('categories', 'products', 'service-categories', 'services')
        )
      )
    `);

    // 7. Add include_addons_flag column
    await queryRunner.query(`
      ALTER TABLE "vouchers"
        ADD COLUMN "include_addons_flag" boolean
    `);

    // 8. Recreate voucher code unique index to exclude soft-deleted rows
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vouchers_code_upper"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_vouchers_code_upper"
        ON "vouchers" (UPPER("code"))
        WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop dependents
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vouchers_scope"`);
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT IF EXISTS "CHK_vouchers_scope_seller_consistency"`,
    );

    // 2. Convert column to text
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" TYPE text USING "scope"::text`,
    );

    // 3. Drop enum, recreate with 'global'
    await queryRunner.query(`DROP TYPE "public"."vouchers_scope_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."vouchers_scope_enum" AS ENUM('global', 'categories', 'products', 'service-categories', 'services')`,
    );

    // 4. Convert column back to enum
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" TYPE "public"."vouchers_scope_enum" USING "scope"::"public"."vouchers_scope_enum"`,
    );

    // 5. Restore default, index, and original CHECK constraint
    await queryRunner.query(
      `ALTER TABLE "vouchers" ALTER COLUMN "scope" SET DEFAULT 'global'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vouchers_scope" ON "vouchers" ("scope")`,
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

    // Drop include_addons_flag column
    await queryRunner.query(`
      ALTER TABLE "vouchers" DROP COLUMN IF EXISTS "include_addons_flag"
    `);

    // Revert voucher code unique index to original (without partial filter)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vouchers_code_upper"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_vouchers_code_upper"
        ON "vouchers" (UPPER("code"))
    `);
  }
}
