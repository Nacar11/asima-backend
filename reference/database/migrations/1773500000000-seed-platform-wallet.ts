import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPlatformWallet1773500000000 implements MigrationInterface {
  name = 'SeedPlatformWallet1773500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find the system admin user by role. Uses the first user with role 'admin'
    // so this works regardless of what user_id was assigned in this environment.
    // ON CONFLICT DO NOTHING makes this idempotent.
    await queryRunner.query(`
      INSERT INTO "wallets" ("user_id", "wallet_type", "seller_id", "currency_code", "status")
      SELECT u.id, 'admin', NULL, 'PHP', 'active'
      FROM "user" u
      WHERE u.system_admin = true
      ORDER BY u.id ASC
      LIMIT 1
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "wallets"
      WHERE "wallet_type" = 'admin'
    `);
  }
}
