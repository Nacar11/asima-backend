import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add 'general' value to the service_type_enum PostgreSQL enum.
 *
 * General services use the simplest booking flow:
 * pay upfront → provider confirms → service delivered → complete.
 * No quotation, checklist, or milestones.
 */
export class AddGeneralToServiceTypeEnum1770400000000
  implements MigrationInterface
{
  name = 'AddGeneralToServiceTypeEnum1770400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "service_type_enum" ADD VALUE IF NOT EXISTS 'general'`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // To reverse this, you would need to recreate the enum type without 'general'
    // and update all referencing columns. This is intentionally left as a no-op
    // because removing an enum value is destructive and rarely needed.
  }
}
