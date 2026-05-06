import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceIdToVouchers1770600000002 implements MigrationInterface {
  name = 'AddServiceIdToVouchers1770600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD COLUMN "service_id" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "vouchers"
      ADD CONSTRAINT "FK_vouchers_service_id"
      FOREIGN KEY ("service_id") REFERENCES "services"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vouchers_service_id" ON "vouchers" ("service_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vouchers_service_id"`);
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT "FK_vouchers_service_id"`,
    );
    await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "service_id"`);
  }
}
