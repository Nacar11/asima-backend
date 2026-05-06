import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetadataToCheckoutPayments1771582325243
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "checkout_payments"
            ADD COLUMN "metadata" JSONB
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "checkout_payments"
            DROP COLUMN "metadata"
        `);
  }
}
