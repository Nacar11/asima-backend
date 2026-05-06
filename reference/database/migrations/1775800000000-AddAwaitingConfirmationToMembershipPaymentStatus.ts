import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAwaitingConfirmationToMembershipPaymentStatus1775800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."membership_payments_payment_status_enum" ADD VALUE IF NOT EXISTS 'AWAITING_CONFIRMATION'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // To roll back, recreate the enum without AWAITING_CONFIRMATION.
  }
}
