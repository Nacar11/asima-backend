import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentRefundMethodToReturnRequests1771100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'return_requests',
      new TableColumn({
        name: 'payment_refund_method',
        type: 'varchar',
        length: '30',
        isNullable: true,
        comment:
          'Disbursement method: dragonpay, cash, wallet (null = not yet chosen)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('return_requests', 'payment_refund_method');
  }
}
