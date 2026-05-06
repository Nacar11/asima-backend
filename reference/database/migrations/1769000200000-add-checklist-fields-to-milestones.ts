import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add DPO checklist fields to milestone tables.
 *
 * Extends service_milestone_templates and booking_milestones to support
 * checklist items for assessment services. Checklist items have response
 * types (checkbox, text, rating, photo, measurement) and store provider input.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export class AddChecklistFieldsToMilestones1769000200000
  implements MigrationInterface
{
  name = 'AddChecklistFieldsToMilestones1769000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "milestone_type_enum" AS ENUM ('milestone', 'checklist')
    `);

    await queryRunner.query(`
      CREATE TYPE "checklist_response_type_enum" AS ENUM
      ('checkbox', 'text', 'rating', 'photo', 'measurement')
    `);

    // ==================== service_milestone_templates ====================

    await queryRunner.query(`
      ALTER TABLE "service_milestone_templates"
      ADD COLUMN "template_type" "milestone_type_enum" NOT NULL DEFAULT 'milestone'
    `);

    await queryRunner.query(`
      ALTER TABLE "service_milestone_templates"
      ADD COLUMN "category" VARCHAR(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "service_milestone_templates"
      ADD COLUMN "response_type" "checklist_response_type_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "service_milestone_templates"
      ADD COLUMN "measurement_unit" VARCHAR(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "service_milestone_templates"
      ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT false
    `);

    // ==================== booking_milestones ====================

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "milestone_type" "milestone_type_enum" NOT NULL DEFAULT 'milestone'
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "category" VARCHAR(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "response_type" "checklist_response_type_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "checkbox_value" BOOLEAN
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "text_value" TEXT
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "rating_value" SMALLINT
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "measurement_value" DECIMAL(10,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "measurement_unit" VARCHAR(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "photo_urls" JSONB
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_milestones"
      ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop booking_milestones columns
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "is_required"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "photo_urls"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "measurement_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "measurement_value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "rating_value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "text_value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "checkbox_value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "response_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_milestones" DROP COLUMN "milestone_type"`,
    );

    // Drop service_milestone_templates columns
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" DROP COLUMN "is_required"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" DROP COLUMN "measurement_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" DROP COLUMN "response_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" DROP COLUMN "category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_milestone_templates" DROP COLUMN "template_type"`,
    );

    // Drop enum types
    await queryRunner.query(`DROP TYPE "checklist_response_type_enum"`);
    await queryRunner.query(`DROP TYPE "milestone_type_enum"`);
  }
}
