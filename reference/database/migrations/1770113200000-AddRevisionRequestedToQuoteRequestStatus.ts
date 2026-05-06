import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevisionRequestedToQuoteRequestStatus1770113200000
  implements MigrationInterface
{
  name = 'AddRevisionRequestedToQuoteRequestStatus1770113200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'Revision Requested' value to the quote_requests status enum
    await queryRunner.query(`
      ALTER TYPE "quote_requests_status_enum" ADD VALUE IF NOT EXISTS 'Revision Requested'
    `);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values
    // To revert, you would need to:
    // 1. Create a new enum without the value
    // 2. Update all rows
    // 3. Drop the old enum
    // 4. Rename the new enum
  }
}
