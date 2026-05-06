import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToAllTables1765534200000 implements MigrationInterface {
  name = 'AddStatusToAllTables1765534200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. service_areas - Replace is_active with status
    await queryRunner.query(
      `ALTER TABLE "service_areas" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `UPDATE "service_areas" SET "status" = CASE WHEN "is_active" = true THEN 'Active' ELSE 'Inactive' END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_service_areas_is_active"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_areas_status" ON "service_areas" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_areas" DROP COLUMN "is_active"`,
    );

    // 2. service_gallery - Add status
    await queryRunner.query(
      `ALTER TABLE "service_gallery" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_gallery_status" ON "service_gallery" ("status")`,
    );

    // 3. service_milestone_templates - Replace is_active with status
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `UPDATE "service_milestone_templates" SET "status" = CASE WHEN "is_active" = true THEN 'Active' ELSE 'Inactive' END`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_milestone_templates_status" ON "service_milestone_templates" ("status")`,
    );

    // 4. seller_schedules - Replace is_available with status
    await queryRunner.query(
      `ALTER TABLE "seller_schedules" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `UPDATE "seller_schedules" SET "status" = CASE WHEN "is_available" = true THEN 'Active' ELSE 'Inactive' END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_seller_schedules_is_available"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_schedules_status" ON "seller_schedules" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_schedules" DROP COLUMN "is_available"`,
    );

    // 5. member_schedules - Replace is_available with status
    await queryRunner.query(
      `ALTER TABLE "member_schedules" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `UPDATE "member_schedules" SET "status" = CASE WHEN "is_available" = true THEN 'Active' ELSE 'Inactive' END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_member_schedules_is_available"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_member_schedules_status" ON "member_schedules" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "member_schedules" DROP COLUMN "is_available"`,
    );

    // 6. store_unavailability - Add status
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_status" ON "store_unavailability" ("status")`,
    );

    // 7. seller_member_services - Add status
    await queryRunner.query(
      `ALTER TABLE "seller_member_services" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_member_services_status" ON "seller_member_services" ("status")`,
    );

    // 8. cancellation_policies - Replace is_active with status
    await queryRunner.query(
      `ALTER TABLE "cancellation_policies" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `UPDATE "cancellation_policies" SET "status" = CASE WHEN "is_active" = true THEN 'Active' ELSE 'Inactive' END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_cancellation_policies_is_active"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cancellation_policies_status" ON "cancellation_policies" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cancellation_policies" DROP COLUMN "is_active"`,
    );

    // 9. currencies - Replace is_active with status
    await queryRunner.query(
      `ALTER TABLE "currencies" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `UPDATE "currencies" SET "status" = CASE WHEN "is_active" = true THEN 'Active' ELSE 'Inactive' END`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_currencies_is_active"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_currencies_status" ON "currencies" ("status")`,
    );
    await queryRunner.query(`ALTER TABLE "currencies" DROP COLUMN "is_active"`);

    // 10. notifications - Add status (keep read_at)
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_status" ON "notifications" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 10. notifications - Revert
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notifications_status"`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "status"`);

    // 9. currencies - Revert
    await queryRunner.query(
      `ALTER TABLE "currencies" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "currencies" SET "is_active" = CASE WHEN "status" = 'Active' THEN true ELSE false END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_currencies_status"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_currencies_is_active" ON "currencies" ("is_active")`,
    );
    await queryRunner.query(`ALTER TABLE "currencies" DROP COLUMN "status"`);

    // 8. cancellation_policies - Revert
    await queryRunner.query(
      `ALTER TABLE "cancellation_policies" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "cancellation_policies" SET "is_active" = CASE WHEN "status" = 'Active' THEN true ELSE false END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_cancellation_policies_status"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cancellation_policies_is_active" ON "cancellation_policies" ("is_active")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cancellation_policies" DROP COLUMN "status"`,
    );

    // 7. seller_member_services - Revert
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_seller_member_services_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_member_services" DROP COLUMN "status"`,
    );

    // 6. store_unavailability - Revert
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_store_unavailability_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" DROP COLUMN "status"`,
    );

    // 5. member_schedules - Revert
    await queryRunner.query(
      `ALTER TABLE "member_schedules" ADD COLUMN "is_available" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "member_schedules" SET "is_available" = CASE WHEN "status" = 'Active' THEN true ELSE false END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_member_schedules_status"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_member_schedules_is_available" ON "member_schedules" ("is_available")`,
    );
    await queryRunner.query(
      `ALTER TABLE "member_schedules" DROP COLUMN "status"`,
    );

    // 4. seller_schedules - Revert
    await queryRunner.query(
      `ALTER TABLE "seller_schedules" ADD COLUMN "is_available" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "seller_schedules" SET "is_available" = CASE WHEN "status" = 'Active' THEN true ELSE false END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_seller_schedules_status"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_schedules_is_available" ON "seller_schedules" ("is_available")`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_schedules" DROP COLUMN "status"`,
    );

    // 3. service_milestone_templates - Revert
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "service_milestone_templates" SET "is_active" = CASE WHEN "status" = 'Active' THEN true ELSE false END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_service_milestone_templates_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" DROP COLUMN "status"`,
    );

    // 2. service_gallery - Revert
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_service_gallery_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_gallery" DROP COLUMN "status"`,
    );

    // 1. service_areas - Revert
    await queryRunner.query(
      `ALTER TABLE "service_areas" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "service_areas" SET "is_active" = CASE WHEN "status" = 'Active' THEN true ELSE false END`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_service_areas_status"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_areas_is_active" ON "service_areas" ("is_active")`,
    );
    await queryRunner.query(`ALTER TABLE "service_areas" DROP COLUMN "status"`);
  }
}
