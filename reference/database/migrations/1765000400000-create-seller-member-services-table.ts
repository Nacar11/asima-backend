import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSellerMemberServicesTable1765000400000
  implements MigrationInterface
{
  name = 'CreateSellerMemberServicesTable1765000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."seller_member_services_proficiency_level_enum" AS ENUM('trainee', 'standard', 'expert')
    `);

    await queryRunner.query(`
      CREATE TABLE "seller_member_services" (
        "id" SERIAL NOT NULL,
        "seller_member_id" integer NOT NULL,
        "service_id" integer NOT NULL,
        "proficiency_level" "public"."seller_member_services_proficiency_level_enum" NOT NULL DEFAULT 'standard',
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_seller_member_services_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_seller_member_services_member" FOREIGN KEY ("seller_member_id") REFERENCES "seller_members"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_seller_member_services_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_seller_member_services_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_seller_member_services_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_seller_member_service_pair" ON "seller_member_services" ("seller_member_id","service_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_seller_member_service_pair"`);
    await queryRunner.query(`DROP TABLE "seller_member_services"`);
    await queryRunner.query(
      `DROP TYPE "public"."seller_member_services_proficiency_level_enum"`,
    );
  }
}
