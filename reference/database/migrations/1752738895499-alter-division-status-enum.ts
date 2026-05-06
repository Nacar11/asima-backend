import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDivisionStatusEnum1752738895499
  implements MigrationInterface
{
  name = 'AlterDivisionStatusEnum1752738895499';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename the previous enum
    await queryRunner.query(
      `ALTER TYPE "public"."division_status_enum" RENAME TO "division_status_enum_old"`,
    );

    // 2. Create the new enum
    await queryRunner.query(
      `CREATE TYPE "public"."division_status_enum" AS ENUM('Active', 'Cancelled', 'Hold')`,
    );

    // 3. Rename the previous enum column
    await queryRunner.query(
      `ALTER TABLE "division" rename "status" to "old_status"`,
    );

    // 4. Add new column of new enum type
    await queryRunner.query(
      `ALTER TABLE "division" ADD "status" "public"."division_status_enum" NOT NULL DEFAULT 'Active'`,
    );

    // 5. Copy values to the new column
    await queryRunner.query(
      `UPDATE "division" SET "status" = "old_status"::TEXT::"public"."division_status_enum"`,
    );

    // 6. Remove Old Column and Type
    await queryRunner.query(`ALTER TABLE "division" DROP COLUMN "old_status"`);
    await queryRunner.query(`DROP TYPE "public"."division_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Step 1: Recreate old enum type
    await queryRunner.query(
      `CREATE TYPE "public"."division_status_enum_old" AS ENUM('Active', 'Cancelled', 'Hold')`,
    );

    // Revert Step 2: Add old_status column back
    await queryRunner.query(
      `ALTER TABLE "division" ADD "old_status" "public"."division_status_enum_old"`,
    );

    // Revert Step 3: Copy values back to old_status column
    await queryRunner.query(
      `UPDATE "division" SET "old_status" = "status"::TEXT::"public"."division_status_enum_old"`,
    );

    // Revert Step 4: Remove new status column
    await queryRunner.query(`ALTER TABLE "division" DROP COLUMN "status"`);

    // Revert Step 5: Drop new enum type
    await queryRunner.query(`DROP TYPE "public"."division_status_enum"`);

    // Revert Step 6: Rename old enum back to original
    await queryRunner.query(
      `ALTER TYPE "public"."division_status_enum_old" RENAME TO "division_status_enum"`,
    );

    // Revert column name to original
    await queryRunner.query(
      `ALTER TABLE "division" RENAME "old_status" TO "status"`,
    );
  }
}
