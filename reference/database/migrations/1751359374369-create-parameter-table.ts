import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParameterTable1751359374369 implements MigrationInterface {
  name = 'CreateParametersTable1751359374369';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."parameter_status_enum" AS ENUM('Active', 'Cancelled', 'New', 'Hold')`,
    );
    await queryRunner.query(
      `CREATE TABLE "parameter" (
        "id" SERIAL NOT NULL, 
        "code" character varying(50) NOT NULL, 
        "param_items" character varying(50) NOT NULL, 
        "description" character varying(200), 
        "string_value" character varying(1000), 
        "numeric_value" numeric(18, 4), 
        "boolean_value" boolean, 
        "date_value" TIMESTAMP, 
        "salt" character varying(255), 
        "status" "public"."parameter_status_enum" NOT NULL DEFAULT 'Active', 
        "created_by" integer, 
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "updated_by" integer, 
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE, 
        CONSTRAINT "PK_cc5c047040f9c69f0e0d6a844a0" PRIMARY KEY ("id")
        )
        `,
    );
    await queryRunner.query(
      `ALTER TABLE "parameter" ADD CONSTRAINT "FK_304ef8b7824dfbeb92370475d4c" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parameter" ADD CONSTRAINT "FK_5bf26103d67c3bd6eefbc2db221" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parameter" ADD CONSTRAINT "FK_7a73c53d41bf3ea1577c549ee49" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "parameter" DROP CONSTRAINT "FK_7a73c53d41bf3ea1577c549ee49"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parameter" DROP CONSTRAINT "FK_5bf26103d67c3bd6eefbc2db221"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parameter" DROP CONSTRAINT "FK_304ef8b7824dfbeb92370475d4c"`,
    );
    await queryRunner.query(`DROP TABLE "parameter"`);
    await queryRunner.query(`DROP TYPE "public"."parameter_status_enum"`);
  }
}
