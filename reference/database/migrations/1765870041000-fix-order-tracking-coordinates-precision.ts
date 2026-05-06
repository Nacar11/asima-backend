import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix latitude/longitude precision in order_tracking_events table
 *
 * Problem: DECIMAL(10, 8) only allows 2 integer digits (max 99.99999999)
 * But longitude ranges from -180 to +180, requiring 3 integer digits
 *
 * Solution: Change to DECIMAL(11, 8) which allows 3 integer digits (-999.99999999 to 999.99999999)
 */
export class FixOrderTrackingCoordinatesPrecision1765870041000
  implements MigrationInterface
{
  name = 'FixOrderTrackingCoordinatesPrecision1765870041000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alter latitude column: DECIMAL(10, 8) -> DECIMAL(11, 8)
    await queryRunner.query(`
      ALTER TABLE "order_tracking_events"
      ALTER COLUMN "latitude" TYPE DECIMAL(11, 8)
    `);

    // Alter longitude column: DECIMAL(10, 8) -> DECIMAL(11, 8)
    await queryRunner.query(`
      ALTER TABLE "order_tracking_events"
      ALTER COLUMN "longitude" TYPE DECIMAL(11, 8)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert longitude column: DECIMAL(11, 8) -> DECIMAL(10, 8)
    // Note: This may fail if data exists with values >= 100
    await queryRunner.query(`
      ALTER TABLE "order_tracking_events"
      ALTER COLUMN "longitude" TYPE DECIMAL(10, 8)
    `);

    // Revert latitude column: DECIMAL(11, 8) -> DECIMAL(10, 8)
    await queryRunner.query(`
      ALTER TABLE "order_tracking_events"
      ALTER COLUMN "latitude" TYPE DECIMAL(10, 8)
    `);
  }
}
