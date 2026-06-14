import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseTimeEntryRepository } from '@/time-entries/persistence/base-time-entry.repository';
import { TimeEntry } from '@/time-entries/domain/time-entry';
import { TimeEntrySearchCriteria } from '@/time-entries/domain/time-entry-search-criteria';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import {
  PUNCH_COOLDOWN_MINUTES,
  TIME_ENTRY_SOURCES,
  TIME_ENTRY_STATUSES,
  TimeEntrySource,
} from '@/time-entries/time-entries.constants';

/**
 * Postgres unique-violation error code. The DB-level partial unique index
 * `(employee_id) WHERE status='open' AND deleted_at IS NULL` raises this
 * if two concurrent punches both try to create an open entry — the loser
 * gets mapped to a friendly 409.
 */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class TimeEntriesService {
  constructor(private readonly repository: BaseTimeEntryRepository) {}

  findAll(criteria: TimeEntrySearchCriteria): Promise<FindAllTimeEntry> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<TimeEntry> {
    const entry = await this.repository.findById(id);
    if (!entry) throw new NotFoundException(`TimeEntry with id ${id} not found`);
    return entry;
  }

  /**
   * Self-service toggle. The contract:
   *   - Caller has an open entry → close it (set time_out=now, status=confirmed).
   *   - Caller has no open entry  → create one (time_in=now, status=open, source=manual).
   *
   * Concurrency story: the partial unique index on (employee_id) WHERE
   * status='open' AND deleted_at IS NULL is the source of truth. If two
   * punches race and both see "no open entry", the second insert raises
   * 23505 and is mapped to 409 — the client should retry, at which point
   * it will see the open entry and close it.
   */
  async punch(actor: { id: number }): Promise<TimeEntry> {
    await this.assertNotInCooldown(actor.id);

    const open = await this.repository.findOpenForEmployee(actor.id);
    const now = new Date();

    if (open) {
      return this.repository.update(open.id, {
        time_out: now,
        status: TIME_ENTRY_STATUSES.confirmed,
        updated_by: actor.id,
      });
    }

    try {
      return await this.repository.create({
        employee_id: actor.id,
        work_date: toWorkDate(now),
        time_in: now,
        time_out: null,
        source: TIME_ENTRY_SOURCES.manual,
        status: TIME_ENTRY_STATUSES.open,
        created_by: actor.id,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          'Another punch is already in flight for this employee — retry to close the open entry.',
        );
      }
      throw err;
    }
  }

  /**
   * Admin manual create. Refuses to create a second open entry for the
   * target employee — the partial unique index would reject it anyway, but
   * surfacing 422 here gives a clearer error than letting the constraint
   * violation bubble up.
   */
  async create(input: {
    employee_id: number;
    work_date: string;
    time_in: Date;
    time_out?: Date | null;
    source?: TimeEntrySource;
    notes?: string | null;
    created_by?: number | null;
  }): Promise<TimeEntry> {
    const status = input.time_out ? TIME_ENTRY_STATUSES.confirmed : TIME_ENTRY_STATUSES.open;

    if (status === TIME_ENTRY_STATUSES.open) {
      const existingOpen = await this.repository.findOpenForEmployee(input.employee_id);
      if (existingOpen) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: {
            employee_id: `Employee ${input.employee_id} already has an open time entry (id ${existingOpen.id})`,
          },
        });
      }
    }

    if (input.time_out && input.time_out <= input.time_in) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { time_out: 'time_out must be strictly after time_in' },
      });
    }

    try {
      return await this.repository.create({
        employee_id: input.employee_id,
        work_date: input.work_date,
        time_in: input.time_in,
        time_out: input.time_out ?? null,
        source: input.source ?? TIME_ENTRY_SOURCES.admin,
        status,
        notes: input.notes ?? null,
        created_by: input.created_by ?? null,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          `Employee ${input.employee_id} already has an open time entry — close it before creating another.`,
        );
      }
      throw err;
    }
  }

  async update(
    id: number,
    patch: {
      work_date?: string;
      time_in?: Date;
      time_out?: Date | null;
      source?: TimeEntrySource;
      notes?: string | null;
      updated_by?: number | null;
    },
  ): Promise<TimeEntry> {
    const existing = await this.findById(id);

    const time_in = patch.time_in ?? existing.time_in;
    const time_out = patch.time_out !== undefined ? patch.time_out : existing.time_out;

    if (time_out && time_out <= time_in) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { time_out: 'time_out must be strictly after time_in' },
      });
    }

    const status =
      time_out !== null && time_out !== undefined
        ? TIME_ENTRY_STATUSES.confirmed
        : TIME_ENTRY_STATUSES.open;

    return this.repository.update(id, { ...patch, status });
  }

  async softDelete(id: number, deleted_by: number | null): Promise<void> {
    await this.findById(id);
    await this.repository.softDelete(id, deleted_by);
  }

  /** True if the employee already has a non-deleted entry on `work_date`. */
  hasEntryOnDate(employee_id: number, work_date: string): Promise<boolean> {
    return this.repository.existsForEmployeeDate(employee_id, work_date);
  }

  /**
   * Apply an approved time-correction request to the timesheet (plan §10,
   * Q6). The time-correction module owns the request lifecycle; this
   * module owns the `time_entries` write. Called from inside the
   * correction-approval transaction so the status flip and the entry
   * mutation commit together.
   *
   * - `target_entry_id` set   → update that row (source = 'correction').
   * - `target_entry_id` NULL  → create a new row (missed-punch).
   *
   * Pre-checks the one-open-entry invariant and throws a friendly 409
   * before the DB raises 23505 from inside the approve flow (C7 fix).
   */
  async applyCorrection(input: {
    employee_id: number;
    target_entry_id: number | null;
    work_date: string;
    proposed_time_in: Date;
    proposed_time_out: Date | null;
    decided_by: number | null;
  }): Promise<TimeEntry> {
    if (input.proposed_time_out && input.proposed_time_out <= input.proposed_time_in) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { proposed_time_out: 'proposed_time_out must be strictly after proposed_time_in' },
      });
    }

    const willBeOpen = input.proposed_time_out == null;
    const status = willBeOpen ? TIME_ENTRY_STATUSES.open : TIME_ENTRY_STATUSES.confirmed;

    if (input.target_entry_id != null) {
      const target = await this.repository.findById(input.target_entry_id);
      if (!target || target.deleted_at) {
        throw new NotFoundException(
          `Target time entry ${input.target_entry_id} not found or deleted`,
        );
      }
      if (willBeOpen) await this.assertNoOtherOpenEntry(input.employee_id, input.target_entry_id);

      return this.repository.update(input.target_entry_id, {
        work_date: input.work_date,
        time_in: input.proposed_time_in,
        time_out: input.proposed_time_out,
        source: TIME_ENTRY_SOURCES.correction,
        status,
        updated_by: input.decided_by,
      });
    }

    // Authoritative TOCTOU guard: a manual-add ("Add Logs") may have been
    // submitted while the day had no entry, then an entry appeared before the
    // approver acted. Two confirmed entries on one day are NOT caught by the
    // open-only partial unique index, so block the duplicate here.
    if (await this.repository.existsForEmployeeDate(input.employee_id, input.work_date)) {
      throw new ConflictException({
        status: 409,
        errors: {
          work_date: `Employee ${input.employee_id} already has a time entry on ${input.work_date}.`,
        },
      });
    }

    if (willBeOpen) await this.assertNoOtherOpenEntry(input.employee_id, null);

    try {
      return await this.repository.create({
        employee_id: input.employee_id,
        work_date: input.work_date,
        time_in: input.proposed_time_in,
        time_out: input.proposed_time_out ?? null,
        source: TIME_ENTRY_SOURCES.correction,
        status,
        created_by: input.decided_by,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException({
          status: 409,
          errors: {
            conflict: `Employee ${input.employee_id} already has an open time entry on this date.`,
          },
        });
      }
      throw err;
    }
  }

  /**
   * 429 if the employee's last punch event was less than
   * PUNCH_COOLDOWN_MINUTES ago. The "last event" is the latest entry's
   * `time_out` when clocked out, or its `time_in` when still clocked in.
   * Self-service only — admin `create` and `applyCorrection` bypass this.
   */
  private async assertNotInCooldown(employee_id: number): Promise<void> {
    const latest = await this.repository.findLatestForEmployee(employee_id);
    if (!latest) return;
    const lastEvent = latest.time_out ?? latest.time_in;
    const elapsedMs = Date.now() - new Date(lastEvent).getTime();
    const windowMs = PUNCH_COOLDOWN_MINUTES * 60_000;
    if (elapsedMs < windowMs) {
      const retry_after_seconds = Math.ceil((windowMs - elapsedMs) / 1000);
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          errors: {
            cooldown: `Please wait ${PUNCH_COOLDOWN_MINUTES} minutes between punches.`,
          },
          retry_after_seconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** 409 if the employee has an open entry other than `exceptId`. */
  private async assertNoOtherOpenEntry(
    employee_id: number,
    exceptId: number | null,
  ): Promise<void> {
    const open = await this.repository.findOpenForEmployee(employee_id);
    if (open && open.id !== exceptId) {
      throw new ConflictException({
        status: 409,
        errors: {
          conflict: `Employee ${employee_id} already has an open time entry (id ${open.id}).`,
        },
      });
    }
  }
}

/**
 * Derive YYYY-MM-DD from a Date, in UTC. Overnight shifts that span
 * midnight UTC are still attributed to the date the punch-in landed on —
 * matches the schema.dbml note on `work_date`.
 */
function toWorkDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === PG_UNIQUE_VIOLATION
  );
}
