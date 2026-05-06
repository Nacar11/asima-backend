import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSellerMembersStatusEnumCapitalize1765000500000
  implements MigrationInterface
{
  name = 'AlterSellerMembersStatusEnumCapitalize1765000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename the previous enum
    await queryRunner.query(
      `ALTER TYPE "public"."seller_members_status_enum" RENAME TO "seller_members_status_enum_old"`,
    );

    // 2. Create the new enum with capitalized values
    await queryRunner.query(
      `CREATE TYPE "public"."seller_members_status_enum" AS ENUM('Pending', 'Active', 'Inactive', 'Terminated')`,
    );

    // 3. Rename the previous enum column
    await queryRunner.query(
      `ALTER TABLE "seller_members" RENAME COLUMN "status" TO "old_status"`,
    );

    // 4. Add new column of new enum type
    await queryRunner.query(
      `ALTER TABLE "seller_members" ADD "status" "public"."seller_members_status_enum" NOT NULL DEFAULT 'Active'`,
    );

    // 5. Copy and convert values to the new column (capitalize first letter)
    await queryRunner.query(`
      UPDATE "seller_members" 
      SET "status" = CASE 
        WHEN "old_status"::TEXT = 'pending' THEN 'Pending'::"public"."seller_members_status_enum"
        WHEN "old_status"::TEXT = 'active' THEN 'Active'::"public"."seller_members_status_enum"
        WHEN "old_status"::TEXT = 'inactive' THEN 'Inactive'::"public"."seller_members_status_enum"
        WHEN "old_status"::TEXT = 'terminated' THEN 'Terminated'::"public"."seller_members_status_enum"
        ELSE 'Active'::"public"."seller_members_status_enum"
      END
    `);

    // 6. Remove Old Column and Type
    await queryRunner.query(
      `ALTER TABLE "seller_members" DROP COLUMN "old_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."seller_members_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Step 1: Rename current enum
    await queryRunner.query(
      `ALTER TYPE "public"."seller_members_status_enum" RENAME TO "seller_members_status_enum_new"`,
    );

    // Revert Step 2: Create old enum type with lowercase values
    await queryRunner.query(
      `CREATE TYPE "public"."seller_members_status_enum" AS ENUM('pending', 'active', 'inactive', 'terminated')`,
    );

    // Revert Step 3: Rename status column
    await queryRunner.query(
      `ALTER TABLE "seller_members" RENAME COLUMN "status" TO "old_status"`,
    );

    // Revert Step 4: Add status column back with old enum type
    await queryRunner.query(
      `ALTER TABLE "seller_members" ADD "status" "public"."seller_members_status_enum" NOT NULL DEFAULT 'active'`,
    );

    // Revert Step 5: Copy values from old_status to status (convert to lowercase)
    await queryRunner.query(`
      UPDATE "seller_members" 
      SET "status" = CASE 
        WHEN "old_status"::TEXT = 'Pending' THEN 'pending'::"public"."seller_members_status_enum"
        WHEN "old_status"::TEXT = 'Active' THEN 'active'::"public"."seller_members_status_enum"
        WHEN "old_status"::TEXT = 'Inactive' THEN 'inactive'::"public"."seller_members_status_enum"
        WHEN "old_status"::TEXT = 'Terminated' THEN 'terminated'::"public"."seller_members_status_enum"
        ELSE 'active'::"public"."seller_members_status_enum"
      END
    `);

    // Revert Step 6: Remove old_status column
    await queryRunner.query(
      `ALTER TABLE "seller_members" DROP COLUMN "old_status"`,
    );

    // Revert Step 7: Drop new enum type
    await queryRunner.query(
      `DROP TYPE "public"."seller_members_status_enum_new"`,
    );
  }
}
