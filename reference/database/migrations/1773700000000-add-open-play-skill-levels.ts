import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpenPlaySkillLevels1773700000000 implements MigrationInterface {
  name = 'AddOpenPlaySkillLevels1773700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "open_play_skill_levels" (
        "code" character varying(50) NOT NULL,
        "label" character varying(80) NOT NULL,
        "description" character varying(255),
        "sort_order" integer NOT NULL DEFAULT '0',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_open_play_skill_levels_code" PRIMARY KEY ("code")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_open_play_skill_levels_sort_order" ON "open_play_skill_levels" ("sort_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_open_play_skill_levels_is_active" ON "open_play_skill_levels" ("is_active")`,
    );

    await queryRunner.query(`
      INSERT INTO "open_play_skill_levels" ("code", "label", "description", "sort_order")
      VALUES
        ('all_levels', 'All Levels', 'Suitable for all players', 1),
        ('beginner', 'Beginner', 'Best for new and developing players', 2),
        ('intermediate', 'Intermediate', 'For players with rally and game experience', 3),
        ('advanced', 'Advanced', 'For high-level and competitive players', 4)
    `);

    await queryRunner.query(`
      ALTER TABLE "open_play_events"
      ADD COLUMN "skill_level_code" character varying(50) NOT NULL DEFAULT 'all_levels'
    `);

    await queryRunner.query(`
      UPDATE "open_play_events"
      SET "skill_level_code" = 'all_levels'
      WHERE "skill_level_code" IS NULL OR TRIM("skill_level_code") = ''
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_open_play_events_skill_level_code" ON "open_play_events" ("skill_level_code")`,
    );

    await queryRunner.query(`
      ALTER TABLE "open_play_events"
      ADD CONSTRAINT "FK_open_play_events_skill_level_code"
      FOREIGN KEY ("skill_level_code") REFERENCES "open_play_skill_levels"("code")
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "open_play_events" DROP CONSTRAINT IF EXISTS "FK_open_play_events_skill_level_code"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_open_play_events_skill_level_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "open_play_events" DROP COLUMN IF EXISTS "skill_level_code"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_open_play_skill_levels_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_open_play_skill_levels_sort_order"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "open_play_skill_levels"`);
  }
}
