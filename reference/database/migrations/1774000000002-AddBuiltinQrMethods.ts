import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBuiltinQrMethods1774000000002 implements MigrationInterface {
  name = 'AddBuiltinQrMethods1774000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "custom_payment_methods"
        ADD COLUMN IF NOT EXISTS "code" character varying(100) UNIQUE,
        ADD COLUMN IF NOT EXISTS "is_builtin" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      INSERT INTO "custom_payment_methods"
        ("name", "code", "is_builtin", "is_enabled", "sort_order")
      VALUES
        ('GCash QR', 'gcash', true, true, 3),
        ('Maya QR', 'maya_qr', true, false, 4),
        ('UnionBank QR', 'unionbank_qr', true, false, 5)
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "custom_payment_methods" WHERE "is_builtin" = true
    `);
    await queryRunner.query(`
      ALTER TABLE "custom_payment_methods"
        DROP COLUMN IF EXISTS "code",
        DROP COLUMN IF EXISTS "is_builtin"
    `);
  }
}
