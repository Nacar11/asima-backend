import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyTable1740539700028 implements MigrationInterface {
  name = 'CreateCompanyTable1740539700028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."company_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "company" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."company_status_enum" NOT NULL DEFAULT 'Active', "name" character varying(100) NOT NULL, "is_main" boolean NOT NULL DEFAULT false, "address1" character varying(255) NOT NULL, "address2" character varying(255), "telephone" character varying(20) NOT NULL, "email" character varying(100) NOT NULL, "fiscal_year_start" TIMESTAMP WITH TIME ZONE NOT NULL, "fiscal_year_end" TIMESTAMP WITH TIME ZONE NOT NULL, "month_start" TIMESTAMP WITH TIME ZONE NOT NULL, "month_end" TIMESTAMP WITH TIME ZONE NOT NULL, "prev_month_start" TIMESTAMP WITH TIME ZONE NOT NULL, "prev_month_end" TIMESTAMP WITH TIME ZONE NOT NULL, "next_month_start" TIMESTAMP WITH TIME ZONE NOT NULL, "next_month_end" TIMESTAMP WITH TIME ZONE NOT NULL, "cylce_opening_backup" boolean NOT NULL, "cycle_opening" boolean NOT NULL, "cycle_closing" boolean NOT NULL, "cycle_closing_backup" boolean NOT NULL, "inventory_opening" boolean NOT NULL, "inventory_closing" boolean NOT NULL, "created_by" integer, "updated_by" integer, "deleted_by" integer, CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_02d6084f6eb9912c0d8a35f9d0d" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_b8fdf420e133fe881a11a5f7068" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_c517fca3c837ddaa037f49ae8bd" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_c517fca3c837ddaa037f49ae8bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_b8fdf420e133fe881a11a5f7068"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_02d6084f6eb9912c0d8a35f9d0d"`,
    );
    await queryRunner.query(`DROP TABLE "company"`);
    await queryRunner.query(`DROP TYPE "public"."company_status_enum"`);
  }
}
