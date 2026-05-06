// noinspection SqlResolve
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductMediaTables1763359603000
  implements MigrationInterface
{
  name = 'CreateProductMediaTables1763359603000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create status enum if it doesn't exist
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."status_enum" AS ENUM('Active', 'Cancelled', 'Hold');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    );

    // Create media_type enum
    await queryRunner.query(
      `CREATE TYPE "public"."product_media_media_type_enum" AS ENUM('image', 'video')`,
    );

    // Create processing_status enum
    await queryRunner.query(
      `CREATE TYPE "public"."product_media_processing_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'skipped')`,
    );

    // Create product_media table
    await queryRunner.query(
      `CREATE TABLE "product_media" (
        "id" SERIAL NOT NULL,
        "media_type" "public"."product_media_media_type_enum" NOT NULL,
        "file_name" character varying(255) NOT NULL,
        "file_path" character varying(500) NOT NULL,
        "file_size" bigint NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "width" integer,
        "height" integer,
        "duration" integer,
        "thumbnail_path" character varying(500),
        "preview_path" character varying(500),
        "compressed_path" character varying(500),
        "watermarked_path" character varying(500),
        "processing_status" "public"."product_media_processing_status_enum" NOT NULL DEFAULT 'pending',
        "processing_error" text,
        "title" character varying(255),
        "alt_text" character varying(255),
        "description" text,
        "seller_id" integer,
        "status" "public"."status_enum" NOT NULL DEFAULT 'Active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        CONSTRAINT "PK_product_media" PRIMARY KEY ("id")
      )`,
    );

    // Create product_media_mappings table
    await queryRunner.query(
      `CREATE TABLE "product_media_mappings" (
        "id" SERIAL NOT NULL,
        "product_id" integer NOT NULL,
        "media_id" integer NOT NULL,
        "display_order" integer NOT NULL DEFAULT 0,
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_media_mappings" PRIMARY KEY ("id")
      )`,
    );

    // Add foreign key constraints for product_media
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD CONSTRAINT "FK_product_media_created_by" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD CONSTRAINT "FK_product_media_updated_by" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD CONSTRAINT "FK_product_media_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Add foreign key constraint for product_media_mappings
    await queryRunner.query(
      `ALTER TABLE "product_media_mappings" ADD CONSTRAINT "FK_product_media_mappings_media" FOREIGN KEY ("media_id") REFERENCES "product_media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Create indexes for better query performance
    await queryRunner.query(
      `CREATE INDEX "IDX_product_media_media_type" ON "product_media" ("media_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_media_seller_id" ON "product_media" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_media_processing_status" ON "product_media" ("processing_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_media_status" ON "product_media" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_media_mappings_product_id" ON "product_media_mappings" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_media_mappings_media_id" ON "product_media_mappings" ("media_id")`,
    );

    // Unique constraint to ensure only ONE primary image per product
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_media_mappings_primary_unique"
       ON "product_media_mappings" ("product_id")
       WHERE "is_primary" = true`,
    );

    // Unique constraint to prevent duplicate gallery entries
    // (same media can't appear twice in gallery for same product)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_media_mappings_gallery_unique"
       ON "product_media_mappings" ("product_id", "media_id")
       WHERE "is_primary" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_product_media_mappings_gallery_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_product_media_mappings_primary_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_media_mappings_media_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_media_mappings_product_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_product_media_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_media_processing_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_media_seller_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_media_media_type"`,
    );

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "product_media_mappings" DROP CONSTRAINT "FK_product_media_mappings_media"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" DROP CONSTRAINT "FK_product_media_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" DROP CONSTRAINT "FK_product_media_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" DROP CONSTRAINT "FK_product_media_created_by"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "product_media_mappings"`);
    await queryRunner.query(`DROP TABLE "product_media"`);

    // Drop enums
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."product_media_processing_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."product_media_media_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."status_enum"`);
  }
}
