import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Add failure tracking fields to subscription_payments table.
 * These fields are needed for:
 * - Tracking payment failure reasons
 * - Implementing retry logic with backoff
 * - Admin dashboard failed payments list
 */
export class AddFailureFieldsToSubscriptionPayments1766500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('subscription_payments', [
      new TableColumn({
        name: 'failure_reason',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment:
          'Reason for payment failure (e.g., Card Declined, Insufficient Funds)',
      }),
      new TableColumn({
        name: 'retry_count',
        type: 'int',
        default: 0,
        comment: 'Number of payment retry attempts',
      }),
      new TableColumn({
        name: 'next_retry_at',
        type: 'timestamp',
        isNullable: true,
        comment: 'Scheduled time for next payment retry attempt',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('subscription_payments', 'failure_reason');
    await queryRunner.dropColumn('subscription_payments', 'retry_count');
    await queryRunner.dropColumn('subscription_payments', 'next_retry_at');
  }
}
