import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttributeValuesTable1763000000007
  implements MigrationInterface
{
  name = 'CreateAttributeValuesTable1763000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "attribute_values" ("id" SERIAL NOT NULL, "attribute_id" integer NOT NULL, "value" character varying(255) NOT NULL, "display_order" integer NOT NULL DEFAULT 0, "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_attribute_values_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_attribute_values_attribute_id" ON "attribute_values" (
        "attribute_id"
      )`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_attribute_values_unique" ON "attribute_values" (
        "attribute_id",
        "value"
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "attribute_values" ADD CONSTRAINT "FK_attribute_values_attribute_id" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "attribute_values" ADD CONSTRAINT "FK_attribute_values_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attribute_values" ADD CONSTRAINT "FK_attribute_values_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attribute_values" ADD CONSTRAINT "FK_attribute_values_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attribute_values" DROP CONSTRAINT "FK_attribute_values_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attribute_values" DROP CONSTRAINT "FK_attribute_values_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attribute_values" DROP CONSTRAINT "FK_attribute_values_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attribute_values" DROP CONSTRAINT "FK_attribute_values_attribute_id"`,
    );
    await queryRunner.query(`DROP INDEX "idx_attribute_values_unique"`);
    await queryRunner.query(`DROP INDEX "idx_attribute_values_attribute_id"`);
    await queryRunner.query(`DROP TABLE "attribute_values"`);
  }
}
