import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterReturnNumberFormat1766028200000
  implements MigrationInterface
{
  name = 'AlterReturnNumberFormat1766028200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change return_number column from uuid to varchar(50)
    // Using varchar(50) to accommodate both new format (RR-XXXXXXXX-XXXX, ~16 chars)
    // and existing UUIDs (36 chars) for backward compatibility
    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ALTER COLUMN "return_number" TYPE character varying(50) USING return_number::text
    `);

    // Remove the uuid default since we'll generate return numbers in the application
    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ALTER COLUMN "return_number" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: This down migration may fail if there are records with new format
    // that cannot be cast to uuid. Consider this before rolling back.
    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ALTER COLUMN "return_number" SET DEFAULT gen_random_uuid()
    `);

    await queryRunner.query(`
      ALTER TABLE "return_requests"
      ALTER COLUMN "return_number" TYPE uuid USING return_number::uuid
    `);
  }
}
