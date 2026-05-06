import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Add pricing breakdown columns to bookings table.
 *
 * Adds base_price, addons_total, options_total, and location_additional_fee
 * columns to provide itemized price breakdown for better transparency.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export class AddPricingBreakdownToBookings1768000900000
  implements MigrationInterface
{
  name = 'AddPricingBreakdownToBookings1768000900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add base_price column
    await queryRunner.addColumn(
      'bookings',
      new TableColumn({
        name: 'base_price',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    // Add addons_total column
    await queryRunner.addColumn(
      'bookings',
      new TableColumn({
        name: 'addons_total',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    // Add options_total column
    await queryRunner.addColumn(
      'bookings',
      new TableColumn({
        name: 'options_total',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    // Add location_additional_fee column
    await queryRunner.addColumn(
      'bookings',
      new TableColumn({
        name: 'location_additional_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bookings', 'location_additional_fee');
    await queryRunner.dropColumn('bookings', 'options_total');
    await queryRunner.dropColumn('bookings', 'addons_total');
    await queryRunner.dropColumn('bookings', 'base_price');
  }
}
