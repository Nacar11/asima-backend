import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserConstraints1731851385578 implements MigrationInterface {
  name = 'AlterUserConstraints1731851385578';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "cost_center_code" varchar(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_8211d6dd781e2b9e8f887970a41" FOREIGN KEY ("cost_center_code") REFERENCES "cost_center"("cost_center_code") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_8211d6dd781e2b9e8f887970a41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "cost_center_code"`,
    );
  }
}
