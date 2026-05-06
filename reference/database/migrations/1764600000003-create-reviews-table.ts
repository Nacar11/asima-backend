import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewsTable1764600000003 implements MigrationInterface {
  name = 'CreateReviewsTable1764600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."reviews_status_enum" AS ENUM('Active', 'Removed')`,
    );

    // Create reviews table
    await queryRunner.query(
      `CREATE TABLE "reviews" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "seller_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "sales_order_item_id" integer,
        "rating" integer NOT NULL,
        "comment" text,
        "is_anonymous" boolean NOT NULL DEFAULT false,
        "is_verified_purchase" boolean NOT NULL DEFAULT false,
        "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'Active',
        "reply_text" text,
        "reply_at" TIMESTAMP,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_reviews_id" PRIMARY KEY ("id")
      )`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_product_id" ON "reviews" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_seller_id" ON "reviews" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_user_id" ON "reviews" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_rating" ON "reviews" ("rating")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_is_verified_purchase" ON "reviews" ("is_verified_purchase")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_created_at" ON "reviews" ("created_at")`,
    );

    // Create unique constraint for user_id and sales_order_item_id
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "UQ_reviews_user_sales_order_item" UNIQUE ("user_id", "sales_order_item_id")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_sales_order_item_id" FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_sales_order_item_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_seller_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_user_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_reviews_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_is_verified_purchase"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_rating"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_seller_id"`);
    await queryRunner.query(`DROP INDEX "IDX_reviews_product_id"`);

    // Drop unique constraint
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "UQ_reviews_user_sales_order_item"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "reviews"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "public"."reviews_status_enum"`);
  }
}
