import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterServicePackagesStatusEnumCapitalize1766136000000
  implements MigrationInterface
{
  name = 'AlterServicePackagesStatusEnumCapitalize1766136000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename the previous enum
    await queryRunner.query(
      `ALTER TYPE "public"."service_packages_status_enum" RENAME TO "service_packages_status_enum_old"`,
    );

    // 2. Create the new enum with capitalized values
    await queryRunner.query(
      `CREATE TYPE "public"."service_packages_status_enum" AS ENUM('Active', 'Inactive', 'Archived')`,
    );

    // 3. Rename the previous enum column
    await queryRunner.query(
      `ALTER TABLE "service_packages" RENAME COLUMN "status" TO "old_status"`,
    );

    // 4. Add new column of new enum type
    await queryRunner.query(
      `ALTER TABLE "service_packages" ADD "status" "public"."service_packages_status_enum" NOT NULL DEFAULT 'Active'`,
    );

    // 5. Copy and convert values to the new column (capitalize first letter)
    await queryRunner.query(`
      UPDATE "service_packages" 
      SET "status" = CASE 
        WHEN "old_status"::TEXT = 'active' THEN 'Active'::"public"."service_packages_status_enum"
        WHEN "old_status"::TEXT = 'inactive' THEN 'Inactive'::"public"."service_packages_status_enum"
        WHEN "old_status"::TEXT = 'archived' THEN 'Archived'::"public"."service_packages_status_enum"
        ELSE 'Active'::"public"."service_packages_status_enum"
      END
    `);

    // 6. Remove Old Column and Type
    await queryRunner.query(
      `ALTER TABLE "service_packages" DROP COLUMN "old_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."service_packages_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Step 1: Rename current enum
    await queryRunner.query(
      `ALTER TYPE "public"."service_packages_status_enum" RENAME TO "service_packages_status_enum_new"`,
    );

    // Revert Step 2: Create old enum type with lowercase values
    await queryRunner.query(
      `CREATE TYPE "public"."service_packages_status_enum" AS ENUM('active', 'inactive', 'archived')`,
    );

    // Revert Step 3: Rename status column
    await queryRunner.query(
      `ALTER TABLE "service_packages" RENAME COLUMN "status" TO "old_status"`,
    );

    // Revert Step 4: Add status column back with old enum type
    await queryRunner.query(
      `ALTER TABLE "service_packages" ADD "status" "public"."service_packages_status_enum" NOT NULL DEFAULT 'active'`,
    );

    // Revert Step 5: Copy values from old_status to status (convert to lowercase)
    await queryRunner.query(`
      UPDATE "service_packages" 
      SET "status" = CASE 
        WHEN "old_status"::TEXT = 'Active' THEN 'active'::"public"."service_packages_status_enum"
        WHEN "old_status"::TEXT = 'Inactive' THEN 'inactive'::"public"."service_packages_status_enum"
        WHEN "old_status"::TEXT = 'Archived' THEN 'archived'::"public"."service_packages_status_enum"
        ELSE 'active'::"public"."service_packages_status_enum"
      END
    `);

    // Revert Step 6: Remove old_status column
    await queryRunner.query(
      `ALTER TABLE "service_packages" DROP COLUMN "old_status"`,
    );

    // Revert Step 7: Drop new enum type
    await queryRunner.query(
      `DROP TYPE "public"."service_packages_status_enum_new"`,
    );
  }
}
