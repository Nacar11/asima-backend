import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAssignmentsTable1732783368130
  implements MigrationInterface
{
  name = 'CreateUserAssignmentsTable1732783368130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_assignments_status_enum" AS ENUM('Active', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_assignments" ("id" SERIAL NOT NULL, "status" "public"."user_assignments_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "group_id" integer NOT NULL, "user_id" integer NOT NULL, "created_by" integer NOT NULL, "updated_by" integer NOT NULL, "deleted_by" integer, CONSTRAINT "PK_40bcc12fb48e4da72fa8911cae1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_809cbdc88dfa484628495fe9985" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_6cc47337be0682a111c592e5697" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_58c2a65bb25e21512f45d9b7ab4" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_92419bc2fa3dd9629abed12c776" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_ba4b7095fbabdf75fec02d0b381" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_ba4b7095fbabdf75fec02d0b381"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_92419bc2fa3dd9629abed12c776"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_58c2a65bb25e21512f45d9b7ab4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_6cc47337be0682a111c592e5697"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_809cbdc88dfa484628495fe9985"`,
    );
    await queryRunner.query(`DROP TABLE "user_assignments"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_assignments_status_enum"`,
    );
  }
}
