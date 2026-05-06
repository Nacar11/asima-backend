import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSellerCertificationsAndPortfolio1762918000000
  implements MigrationInterface
{
  name = 'CreateSellerCertificationsAndPortfolio1762918000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create seller_certifications table
    await queryRunner.query(`
      CREATE TABLE "seller_certifications" (
        "id" SERIAL PRIMARY KEY,
        "seller_id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "issuer" varchar(255),
        "image_url" varchar(500),
        "credential_id" varchar(100),
        "credential_url" varchar(500),
        "issue_date" date,
        "expiry_date" date,
        "status" varchar(20) NOT NULL DEFAULT 'Active',
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "fk_seller_certifications_seller" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_seller_certifications_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id"),
        CONSTRAINT "fk_seller_certifications_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id"),
        CONSTRAINT "fk_seller_certifications_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id")
      )
    `);

    // Create indexes for seller_certifications
    await queryRunner.query(`
      CREATE INDEX "idx_seller_certifications_seller_id" ON "seller_certifications" ("seller_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_seller_certifications_status" ON "seller_certifications" ("status")
    `);

    // Create seller_portfolio table
    await queryRunner.query(`
      CREATE TABLE "seller_portfolio" (
        "id" SERIAL PRIMARY KEY,
        "seller_id" integer NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "image_url" varchar(500) NOT NULL,
        "project_url" varchar(500),
        "display_order" integer NOT NULL DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'Active',
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" integer,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_by" integer,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "fk_seller_portfolio_seller" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_seller_portfolio_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id"),
        CONSTRAINT "fk_seller_portfolio_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id"),
        CONSTRAINT "fk_seller_portfolio_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id")
      )
    `);

    // Create indexes for seller_portfolio
    await queryRunner.query(`
      CREATE INDEX "idx_seller_portfolio_seller_id" ON "seller_portfolio" ("seller_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_seller_portfolio_status" ON "seller_portfolio" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_seller_portfolio_display_order" ON "seller_portfolio" ("display_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_seller_portfolio_display_order"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_seller_portfolio_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_seller_portfolio_seller_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_seller_certifications_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_seller_certifications_seller_id"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_portfolio"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_certifications"`);
  }
}
