import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVoucherGiftLogsTable1776000000001
  implements MigrationInterface
{
  name = 'CreateVoucherGiftLogsTable1776000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "voucher_gift_logs" (
        "id" SERIAL NOT NULL,
        "voucher_id" integer,
        "gifted_by_user_id" integer NOT NULL,
        "gifted_to_user_id" integer,
        "quantity" integer NOT NULL,
        "voucher_code" varchar(30) NOT NULL,
        "voucher_discount_type" varchar(20) NOT NULL,
        "voucher_discount_value" decimal(10,2) NOT NULL,
        "voucher_max_discount_cap" decimal(10,2),
        "voucher_scope" varchar(30) NOT NULL,
        "voucher_description" varchar(500),
        "seller_id" integer,
        "seller_name" varchar(255),
        "gifted_to_first_name" varchar(255),
        "gifted_to_last_name" varchar(255),
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_voucher_gift_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_voucher_gift_logs_voucher" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_voucher_gift_logs_gifted_by_user" FOREIGN KEY ("gifted_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_voucher_gift_logs_gifted_to_user" FOREIGN KEY ("gifted_to_user_id") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_voucher_gift_logs_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_voucher_gift_logs_voucher_id" ON "voucher_gift_logs" ("voucher_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_voucher_gift_logs_gifted_by_user_id" ON "voucher_gift_logs" ("gifted_by_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_voucher_gift_logs_gifted_to_user_id" ON "voucher_gift_logs" ("gifted_to_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_voucher_gift_logs_created_at" ON "voucher_gift_logs" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_voucher_gift_logs_created_at"`);
    await queryRunner.query(
      `DROP INDEX "IDX_voucher_gift_logs_gifted_to_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_voucher_gift_logs_gifted_by_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_voucher_gift_logs_voucher_id"`);
    await queryRunner.query(`DROP TABLE "voucher_gift_logs"`);
  }
}
