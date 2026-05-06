import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add service_type enum to services table.
 *
 * Distinguishes between standard (preventive) and assessment (DPO) services.
 * Assessment services generate post-service quotations.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export class AddServiceTypeToServices1769000000000
  implements MigrationInterface
{
  name = 'AddServiceTypeToServices1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the enum type
    await queryRunner.query(`
      CREATE TYPE "service_type_enum" AS ENUM ('standard', 'assessment')
    `);

    // Add the column with default value
    await queryRunner.query(`
      ALTER TABLE "services"
      ADD COLUMN "service_type" "service_type_enum" NOT NULL DEFAULT 'standard'
    `);

    // Add index for filtering by service type
    await queryRunner.query(`
      CREATE INDEX "IDX_services_service_type" ON "services" ("service_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_services_service_type"`);
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN "service_type"`,
    );
    await queryRunner.query(`DROP TYPE "service_type_enum"`);
  }
}
