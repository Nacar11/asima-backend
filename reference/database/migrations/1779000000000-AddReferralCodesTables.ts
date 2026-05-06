import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferralCodesTables1779000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE referral_codes_status_enum AS ENUM ('active', 'inactive')
    `);

    await queryRunner.query(`
      CREATE TYPE referral_codes_selection_mode_enum AS ENUM ('auto_assign', 'user_selection')
    `);

    await queryRunner.query(`
      CREATE TYPE referral_code_usages_selection_status_enum AS ENUM (
        'not_applicable', 'pending', 'completed', 'auto_assigned'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE referral_codes (
        id                       SERIAL PRIMARY KEY,
        code                     VARCHAR(50) NOT NULL,
        description              TEXT NULL,
        status                   referral_codes_status_enum NOT NULL DEFAULT 'active',
        usage_limit              INT NULL,
        usage_count              INT NOT NULL DEFAULT 0,
        expires_at               TIMESTAMPTZ NULL,
        selection_mode           referral_codes_selection_mode_enum NOT NULL DEFAULT 'auto_assign',
        max_voucher_selections   INT NULL,
        selection_timeout_hours  INT NULL,
        created_by               INT NULL REFERENCES "user"(id) ON DELETE SET NULL,
        updated_by               INT NULL REFERENCES "user"(id) ON DELETE SET NULL,
        deleted_by               INT NULL REFERENCES "user"(id) ON DELETE SET NULL,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at               TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_referral_codes_code ON referral_codes(code)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_referral_codes_status ON referral_codes(status)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE referral_code_vouchers (
        id                 SERIAL PRIMARY KEY,
        referral_code_id   INT NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
        voucher_id         INT NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (referral_code_id, voucher_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_referral_code_vouchers_rc_id
      ON referral_code_vouchers(referral_code_id)
    `);

    await queryRunner.query(`
      CREATE TABLE referral_code_usages (
        id                  SERIAL PRIMARY KEY,
        referral_code_id    INT NOT NULL REFERENCES referral_codes(id),
        user_id             INT NOT NULL REFERENCES "user"(id),
        selection_status    referral_code_usages_selection_status_enum NOT NULL DEFAULT 'not_applicable',
        selection_deadline  TIMESTAMPTZ NULL,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (referral_code_id, user_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_referral_code_usages_user_id ON referral_code_usages(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_referral_code_usages_pending
      ON referral_code_usages(selection_status)
      WHERE selection_status = 'pending'
    `);

    await queryRunner.query(`
      CREATE TABLE referral_code_usage_selections (
        id                      SERIAL PRIMARY KEY,
        referral_code_usage_id  INT NOT NULL REFERENCES referral_code_usages(id) ON DELETE CASCADE,
        voucher_id              INT NOT NULL REFERENCES vouchers(id),
        selected_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (referral_code_usage_id, voucher_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_referral_code_usage_selections_usage_id
      ON referral_code_usage_selections(referral_code_usage_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS referral_code_usage_selections`);
    await queryRunner.query(`DROP TABLE IF EXISTS referral_code_usages`);
    await queryRunner.query(`DROP TABLE IF EXISTS referral_code_vouchers`);
    await queryRunner.query(`DROP TABLE IF EXISTS referral_codes`);
    await queryRunner.query(`DROP TYPE IF EXISTS referral_code_usages_selection_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS referral_codes_selection_mode_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS referral_codes_status_enum`);
  }
}
