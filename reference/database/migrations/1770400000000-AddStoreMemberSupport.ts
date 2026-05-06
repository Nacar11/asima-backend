import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreMemberSupport1770400000000 implements MigrationInterface {
  name = 'AddStoreMemberSupport1770400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add seller_id column to user_groups if not exists
    const hasSellerIdColumn = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'user_groups' AND column_name = 'seller_id'
    `);

    if (hasSellerIdColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "user_groups"
        ADD COLUMN "seller_id" integer,
        ADD CONSTRAINT "fk_user_groups_seller"
          FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE
      `);
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_groups_seller_id" ON "user_groups" ("seller_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_groups_seller_group_name"
      ON "user_groups" ("seller_id", "group_name")
      WHERE "seller_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_groups_admin_group_name"
      ON "user_groups" ("group_name")
      WHERE "seller_id" IS NULL
    `);

    // Create enum type if not exists
    const hasStatusEnum = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'user_seller_assignments_status_enum'
    `);

    if (hasStatusEnum.length === 0) {
      await queryRunner.query(`
        CREATE TYPE "user_seller_assignments_status_enum" AS ENUM ('Active', 'Cancelled')
      `);
    }

    // Create user_seller_assignments table if not exists
    const hasTable = await queryRunner.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'user_seller_assignments'
    `);

    if (hasTable.length === 0) {
      await queryRunner.query(`
        CREATE TABLE "user_seller_assignments" (
          "id" SERIAL PRIMARY KEY,
          "seller_id" integer NOT NULL,
          "user_id" integer NOT NULL,
          "status" "user_seller_assignments_status_enum" NOT NULL DEFAULT 'Active',
          "created_by" integer,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_by" integer,
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_by" integer,
          "deleted_at" TIMESTAMP,
          CONSTRAINT "fk_user_seller_assignments_seller" FOREIGN KEY ("seller_id")
            REFERENCES "sellers"("id") ON DELETE CASCADE,
          CONSTRAINT "fk_user_seller_assignments_user" FOREIGN KEY ("user_id")
            REFERENCES "user"("id") ON DELETE CASCADE,
          CONSTRAINT "fk_user_seller_assignments_created_by" FOREIGN KEY ("created_by")
            REFERENCES "user"("id") ON DELETE SET NULL,
          CONSTRAINT "fk_user_seller_assignments_updated_by" FOREIGN KEY ("updated_by")
            REFERENCES "user"("id") ON DELETE SET NULL,
          CONSTRAINT "fk_user_seller_assignments_deleted_by" FOREIGN KEY ("deleted_by")
            REFERENCES "user"("id") ON DELETE SET NULL
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "idx_user_seller_assignments_seller_id"
        ON "user_seller_assignments" ("seller_id")
      `);

      // Partial unique indexes: only enforce uniqueness among non-deleted rows
      // so soft-deleted records don't block re-assignment
      await queryRunner.query(`
        CREATE UNIQUE INDEX "uq_user_seller_active_user"
        ON "user_seller_assignments" ("user_id")
        WHERE "deleted_at" IS NULL
      `);

      await queryRunner.query(`
        CREATE UNIQUE INDEX "uq_user_seller_active_seller_user"
        ON "user_seller_assignments" ("seller_id", "user_id")
        WHERE "deleted_at" IS NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_user_seller_active_seller_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_user_seller_active_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_user_seller_assignments_seller_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_seller_assignments"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "user_seller_assignments_status_enum"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_user_groups_admin_group_name"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_user_groups_seller_group_name"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_groups_seller_id"`);
    await queryRunner.query(`
      ALTER TABLE "user_groups" DROP CONSTRAINT IF EXISTS "fk_user_groups_seller"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_groups" DROP COLUMN IF EXISTS "seller_id"
    `);
  }
}
