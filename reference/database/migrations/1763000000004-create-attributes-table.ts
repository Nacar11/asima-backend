import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttributesTable1763000000004 implements MigrationInterface {
  name = 'CreateAttributesTable1763000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "attributes" ("id" SERIAL NOT NULL, "seller_id" integer NOT NULL, "name" character varying(100) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'Active', "created_by" integer, "updated_by" integer, "deleted_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_attributes_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_attributes_name" ON "attributes" ("name")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_attributes_seller_id" ON "attributes" ("seller_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "attributes" ADD CONSTRAINT "FK_attributes_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "attributes" ADD CONSTRAINT "FK_attributes_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" ADD CONSTRAINT "FK_attributes_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" ADD CONSTRAINT "FK_attributes_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attributes" DROP CONSTRAINT "FK_attributes_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" DROP CONSTRAINT "FK_attributes_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" DROP CONSTRAINT "FK_attributes_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attributes" DROP CONSTRAINT "FK_attributes_seller_id"`,
    );
    await queryRunner.query(`DROP INDEX "idx_attributes_seller_id"`);
    await queryRunner.query(`DROP INDEX "idx_attributes_name"`);
    await queryRunner.query(`DROP TABLE "attributes"`);
  }
}
