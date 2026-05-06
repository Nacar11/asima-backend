import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomPaymentMethods1774000000000
  implements MigrationInterface
{
  name = 'CreateCustomPaymentMethods1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "custom_payment_methods" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "icon_url" character varying(500),
        "is_enabled" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 100,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_custom_payment_methods" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "custom_payment_methods"`);
  }
}
