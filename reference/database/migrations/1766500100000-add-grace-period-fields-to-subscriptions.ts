import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Add grace period tracking fields to subscriptions table.
 * These fields are needed for:
 * - Grace period management
 * - Tracking when grace period started
 * - Auto-suspend after grace period ends
 */
export class AddGracePeriodFieldsToSubscriptions1766500100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('subscriptions', [
      new TableColumn({
        name: 'grace_period_start',
        type: 'timestamp',
        isNullable: true,
        comment: 'When the grace period started',
      }),
      new TableColumn({
        name: 'grace_period_end',
        type: 'timestamp',
        isNullable: true,
        comment: 'When the grace period ends',
      }),
      new TableColumn({
        name: 'grace_period_days',
        type: 'int',
        isNullable: true,
        comment: 'Number of grace period days applied',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('subscriptions', 'grace_period_start');
    await queryRunner.dropColumn('subscriptions', 'grace_period_end');
    await queryRunner.dropColumn('subscriptions', 'grace_period_days');
  }
}
