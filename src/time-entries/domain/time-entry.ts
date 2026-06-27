import { TimeEntrySource, TimeEntryStatus } from '@/time-entries/time-entries.constants';

/**
 * Time-entry domain **record** — the persisted shape, as pure data. It is the
 * reconstitution input for the `TimeEntry` aggregate and the read shape the
 * assembler serializes.
 *
 * Pure TS — no `@nestjs/*` (not even `@ApiProperty`), no `typeorm`. The
 * Swagger/HTTP shape lives on `dto/response/time-entry-response.dto.ts`; the
 * lifecycle behavior lives on `domain/time-entry.aggregate.ts`. Field order
 * mirrors `mapper.toDomain` (which drives JSON key order — keep them in sync so
 * the wire stays byte-identical).
 *
 * One row per IN/OUT segment. The `period` column from `docs/schema.dbml` was
 * deliberately dropped in v0; a future migration can re-introduce it as a
 * generated column from `time_in::time` if reporting demands it.
 *
 * Every field uses definite-assignment (`!`) — see the hexagonal rules in
 * `asima-backend/CLAUDE.md`.
 */
export class TimeEntryRecord {
  id!: number;

  /** FK to users.id (the employee, not the actor). */
  employee_id!: number;

  /** The calendar date this segment counts toward — handles overnight shifts. */
  work_date!: string;

  time_in!: Date;

  /** NULL while status=open (employee still clocked in). */
  time_out!: Date | null;

  /** How this row was created — see TIME_ENTRY_SOURCES. */
  source!: TimeEntrySource;

  /** Lifecycle — only one open row per employee is allowed (DB partial index). */
  status!: TimeEntryStatus;

  notes!: string | null;

  created_by!: number | null;

  updated_by!: number | null;

  deleted_by!: number | null;

  created_at!: Date;

  updated_at!: Date;

  deleted_at!: Date | null;
}
