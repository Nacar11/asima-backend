import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreUnavailabilityTable1765001300000
  implements MigrationInterface
{
  name = 'CreateStoreUnavailabilityTable1765001300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_unavailability" (
        "id" SERIAL NOT NULL,
        "seller_id" integer NOT NULL,
        "seller_member_id" integer,
        "unavailable_date" DATE NOT NULL,
        "start_time" TIME,
        "end_time" TIME,
        "is_full_day" boolean NOT NULL DEFAULT true,
        "reason" character varying(255),
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_store_unavailability_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_store_unavailability_seller" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_store_unavailability_member" FOREIGN KEY ("seller_member_id") REFERENCES "seller_members"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_store_unavailability_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_store_unavailability_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_store_unavailability_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_seller_id" ON "store_unavailability" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_member_id" ON "store_unavailability" ("seller_member_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_date" ON "store_unavailability" ("unavailable_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_full_day" ON "store_unavailability" ("is_full_day")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_store_unavailability_full_day"`);
    await queryRunner.query(`DROP INDEX "IDX_store_unavailability_date"`);
    await queryRunner.query(`DROP INDEX "IDX_store_unavailability_member_id"`);
    await queryRunner.query(`DROP INDEX "IDX_store_unavailability_seller_id"`);
    await queryRunner.query(`DROP TABLE "store_unavailability"`);
  }
}
