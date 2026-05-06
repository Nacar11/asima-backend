import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSellerMembersTable1765000300000
  implements MigrationInterface
{
  name = 'CreateSellerMembersTable1765000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."seller_members_status_enum" AS ENUM('pending', 'active', 'inactive', 'terminated')
    `);

    await queryRunner.query(`
      CREATE TABLE "seller_members" (
        "id" SERIAL NOT NULL,
        "seller_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role" character varying(50) NOT NULL DEFAULT 'member',
        "is_service_provider" boolean NOT NULL DEFAULT true,
        "max_daily_bookings" integer NOT NULL DEFAULT 8,
        "max_concurrent_bookings" integer NOT NULL DEFAULT 1,
        "service_capacity_hours" numeric(4,2) NOT NULL DEFAULT 8,
        "is_available_for_booking" boolean NOT NULL DEFAULT true,
        "display_name" character varying(100),
        "profile_image_url" character varying(500),
        "bio" text,
        "average_rating" numeric(2,1) NOT NULL DEFAULT 0,
        "total_reviews" integer NOT NULL DEFAULT 0,
        "total_completed_bookings" integer NOT NULL DEFAULT 0,
        "status" "public"."seller_members_status_enum" NOT NULL DEFAULT 'active',
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_seller_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_seller_members_seller" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_seller_members_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_seller_members_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_seller_members_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_seller_members_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_seller_members_seller_user" ON "seller_members" ("seller_id","user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_members_status" ON "seller_members" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_members_available" ON "seller_members" ("is_available_for_booking")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_seller_members_available"`);
    await queryRunner.query(`DROP INDEX "IDX_seller_members_status"`);
    await queryRunner.query(`DROP INDEX "UQ_seller_members_seller_user"`);
    await queryRunner.query(`DROP TABLE "seller_members"`);
    await queryRunner.query(`DROP TYPE "public"."seller_members_status_enum"`);
  }
}
