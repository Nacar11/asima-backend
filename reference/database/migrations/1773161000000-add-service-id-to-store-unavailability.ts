import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceIdToStoreUnavailability1773161000000
  implements MigrationInterface
{
  name = 'AddServiceIdToStoreUnavailability1773161000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" ADD COLUMN "service_id" integer`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_store_unavailability_service_id" ON "store_unavailability" ("service_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "store_unavailability"
        ADD CONSTRAINT "FK_store_unavailability_service"
        FOREIGN KEY ("service_id")
        REFERENCES "services"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_unavailability" DROP CONSTRAINT IF EXISTS "FK_store_unavailability_service"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_store_unavailability_service_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "store_unavailability" DROP COLUMN IF EXISTS "service_id"`,
    );
  }
}
