import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEdistrictIdToSellers1778000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sellers ADD COLUMN edistrict_id INT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE sellers
      ADD CONSTRAINT fk_sellers_edistrict_id
      FOREIGN KEY (edistrict_id) REFERENCES edistricts(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_sellers_edistrict_id ON sellers (edistrict_id)
    `);

    // Backfill: assign anjo-world (id=1) — store name contains 'anjo' or is Ulrak Pickle Ball Hub
    await queryRunner.query(`
      UPDATE sellers
      SET edistrict_id = 1
      WHERE (LOWER(store_name) LIKE '%anjo%' OR store_name = 'Ulrak Pickle Ball Hub')
        AND deleted_at IS NULL
    `);

    // Backfill: assign tambayan-district (id=2) — store name contains 'tambayan'
    await queryRunner.query(`
      UPDATE sellers
      SET edistrict_id = 2
      WHERE LOWER(store_name) LIKE '%tambayan%'
        AND deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sellers_edistrict_id`);
    await queryRunner.query(`
      ALTER TABLE sellers DROP CONSTRAINT IF EXISTS fk_sellers_edistrict_id
    `);
    await queryRunner.query(`
      ALTER TABLE sellers DROP COLUMN IF EXISTS edistrict_id
    `);
  }
}
