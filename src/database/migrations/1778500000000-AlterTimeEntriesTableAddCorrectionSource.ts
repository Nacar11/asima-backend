import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add `correction` to the `time_source` enum. Reserved until now — the
 * correction-request approval flow depends on approval_chains and lands
 * with the leave/correction modules (see time-entries CLAUDE.md notes
 * and the 2026-05-30 plan §3.3). Approving a time-correction request
 * writes the underlying time_entries row with `source = 'correction'`.
 */
export class AlterTimeEntriesTableAddCorrectionSource1778500000000 implements MigrationInterface {
  name = 'AlterTimeEntriesTableAddCorrectionSource1778500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "time_source" ADD VALUE IF NOT EXISTS 'correction'`);
  }

  public async down(): Promise<void> {
    // Postgres cannot drop a single enum value. Reverting this migration
    // is a no-op; the unused 'correction' label is harmless. A full
    // rollback would recreate the type — out of scope for a dev revert.
  }
}
