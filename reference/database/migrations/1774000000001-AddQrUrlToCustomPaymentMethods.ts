import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrUrlToCustomPaymentMethods1774000000001
  implements MigrationInterface
{
  name = 'AddQrUrlToCustomPaymentMethods1774000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "custom_payment_methods"
      ADD COLUMN "qr_image_url" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "custom_payment_methods"
      DROP COLUMN "qr_image_url"
    `);
  }
}
