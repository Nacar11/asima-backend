import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `attachments` — generic stored-file registry, NOT leave-specific. The
 * first consumer is leave-request attachments (sick/bereavement); future
 * consumers (profile photos, etc.) reuse the same table + storage seam.
 *
 * `object_key_prefix` holds a generated **UUID** prefix
 * (`leave-attachments/<uuid>`), never the DB id — see the plan's "Why a
 * UUID prefix" note: it lets all object uploads finish before a single
 * short transaction inserts the row, keeping network I/O out of the
 * transaction. `has_versions` is true for images (preview + thumbnail
 * exist) and false for PDFs (original only).
 *
 * Timestamped 1778350000000 — after `users` (1778084598000) and before
 * `leave_requests` (1778400000000), so the `attachment_id` FK folded into
 * the leave-requests CREATE migration resolves.
 */
export class CreateAttachmentsTable1778350000000 implements MigrationInterface {
  name = 'CreateAttachmentsTable1778350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "attachment_kind" AS ENUM ('image', 'pdf')`);

    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id" SERIAL NOT NULL,
        "bucket" text NOT NULL,
        "object_key_prefix" text NOT NULL,
        "original_filename" text NOT NULL,
        "content_type" text NOT NULL,
        "size_bytes" integer NOT NULL,
        "kind" "attachment_kind" NOT NULL,
        "has_versions" boolean NOT NULL,
        "owner_id" integer NOT NULL,
        "created_by" integer,
        "updated_by" integer,
        "deleted_by" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_attachments_size_positive" CHECK ("size_bytes" > 0)
      )
    `);

    // The UUID prefix is the natural unique handle for an attachment's
    // object set; a partial unique index keeps soft-deleted rows from
    // colliding with live ones.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_attachments_object_key_prefix"
      ON "attachments" ("object_key_prefix")
      WHERE "deleted_at" IS NULL
    `);

    for (const [name, column] of [
      ['FK_attachments_owner_id', 'owner_id'],
      ['FK_attachments_created_by', 'created_by'],
      ['FK_attachments_updated_by', 'updated_by'],
      ['FK_attachments_deleted_by', 'deleted_by'],
    ]) {
      await queryRunner.query(`
        ALTER TABLE "attachments"
        ADD CONSTRAINT "${name}"
        FOREIGN KEY ("${column}") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of [
      'FK_attachments_deleted_by',
      'FK_attachments_updated_by',
      'FK_attachments_created_by',
      'FK_attachments_owner_id',
    ]) {
      await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "${name}"`);
    }
    await queryRunner.query(`DROP INDEX "public"."UQ_attachments_object_key_prefix"`);
    await queryRunner.query(`DROP TABLE "attachments"`);
    await queryRunner.query(`DROP TYPE "attachment_kind"`);
  }
}
