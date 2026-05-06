import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerReplyToDisputes1771061092678
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "disputes" ADD "customer_reply" text`);
    await queryRunner.query(
      `ALTER TABLE "disputes" ADD "customer_replied_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "disputes" DROP COLUMN "customer_replied_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" DROP COLUMN "customer_reply"`,
    );
  }
}
