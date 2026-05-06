import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEndDateToStoreUnavailability1765561000000
  implements MigrationInterface
{
  name = 'AddEndDateToStoreUnavailability1765561000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add end_date column to store_unavailability table
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" ADD COLUMN "end_date" DATE`,
    );

    // Add index on end_date for query performance
    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_end_date" ON "store_unavailability" ("end_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_store_unavailability_end_date"`,
    );

    // Remove end_date column
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" DROP COLUMN "end_date"`,
    );
  }
}
