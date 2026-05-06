import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create user_addresses table.
 *
 * This migration creates the user_addresses table that stores user shipping addresses.
 * Users can have multiple addresses with one default address.
 * Implements the address book feature per the e-commerce address architecture PRD.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateUserAddressesTable1764742000000
  implements MigrationInterface
{
  name = 'CreateUserAddressesTable1764742000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_addresses" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "label" character varying(50) NOT NULL DEFAULT 'Shipping',
        "recipient_name" character varying(255) NOT NULL,
        "phone" character varying(20),
        "address_line1" character varying(255) NOT NULL,
        "address_line2" character varying(255),
        "city" character varying(100) NOT NULL,
        "state_province" character varying(100) NOT NULL,
        "postal_code" character varying(20) NOT NULL,
        "country" character varying(100) NOT NULL DEFAULT 'Philippines',
        "is_default" boolean NOT NULL DEFAULT false,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "FK_user_addresses_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_addresses_created_by"
          FOREIGN KEY ("created_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_addresses_updated_by"
          FOREIGN KEY ("updated_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_addresses_deleted_by"
          FOREIGN KEY ("deleted_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    // Index on user_id for fast lookups
    await queryRunner.query(`
      CREATE INDEX "idx_user_addresses_user_id"
      ON "user_addresses" ("user_id")
    `);

    // Index on is_default for finding default address
    await queryRunner.query(`
      CREATE INDEX "idx_user_addresses_is_default"
      ON "user_addresses" ("is_default")
    `);

    // Index on deleted_at for soft delete queries
    await queryRunner.query(`
      CREATE INDEX "idx_user_addresses_deleted_at"
      ON "user_addresses" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_user_addresses_deleted_at"`);
    await queryRunner.query(`DROP INDEX "idx_user_addresses_is_default"`);
    await queryRunner.query(`DROP INDEX "idx_user_addresses_user_id"`);
    await queryRunner.query(`DROP TABLE "user_addresses"`);
  }
}
