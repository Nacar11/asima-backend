import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseTimeEntryRepository } from '@/time-entries/persistence/base-time-entry.repository';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { TimeEntry } from '@/time-entries/domain/time-entry.aggregate';
import { TimeEntryRecord } from '@/time-entries/domain/time-entry';
import { TimeWindow } from '@/time-entries/domain/value-objects/time-window';
import { InvalidTimeWindowError } from '@/time-entries/domain/time-entry-errors';
import { TimeEntryOpened } from '@/time-entries/domain/events/time-entry-events';
import { TimeEntrySearchCriteria } from '@/time-entries/domain/time-entry-search-criteria';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import { utcDateString } from '@/utils/helpers/dates';
import { conflict, notFound, unprocessable } from '@/utils/helpers/http-errors';
import { isUniqueViolation } from '@/utils/helpers/pg-errors';
import {
  PUNCH_COOLDOWN_MINUTES,
  TIME_ENTRY_SOURCES,
  TIME_ENTRY_STATUSES,
  TimeEntrySource,
} from '@/time-entries/time-entries.constants';

/**
 * Thin use-case for the `time_entries` aggregate: load → reconstitute → call a
 * behavior method → persist a narrow patch → publish events. The lifecycle
 * rules (strictly-after window, open↔confirmed derivation) live on the
 * `TimeEntry` aggregate / `TimeWindow` VO; the I/O guards the aggregate can't do
 * (punch cooldown, one-open invariant, TOCTOU, the `23505`→409 mapping, 404)
 * stay here. Reconstitution is use-case-side from the record each mutate path
 * already holds (no `findAggregateById` — blueprint §3.2 rule 3a, decision #10).
 */
@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly repository: BaseTimeEntryRepository,
    private readonly publisher: DomainEventPublisher,
  ) {}

  findAll(criteria: TimeEntrySearchCriteria): Promise<FindAllTimeEntry> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<TimeEntryRecord> {
    const entry = await this.repository.findById(id);
    if (!entry) throw notFound('TimeEntry', id);
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
  async punch(actor: { id: number }): Promise<TimeEntryRecord> {
    await this.assertNotInCooldown(actor.id);

    const open = await this.repository.findOpenForEmployee(actor.id);
    const now = new Date();

    if (open) {
      const aggregate = TimeEntry.reconstitute(open);
      try {
        aggregate.close(now);
      } catch (err) {
        rethrowTimeEntryDomainError(err);
      }
      const saved = await this.repository.update(open.id, {
        time_out: aggregate.time_out,
        status: aggregate.status,
        updated_by: actor.id,
      });
      this.publisher.publish(aggregate.pullEvents());
      return saved;
    }

    try {
      const created = await this.repository.create({
        employee_id: actor.id,
        work_date: utcDateString(now),
        time_in: now,
        time_out: null,
        source: TIME_ENTRY_SOURCES.manual,
        status: TIME_ENTRY_STATUSES.open,
        created_by: actor.id,
      });
      this.publisher.publish([
        new TimeEntryOpened(created.id, created.employee_id, created.work_date),
      ]);
      return created;
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
   *
   * Check order is preserved from the pre-DDD service: the one-open guard
   * (422 `employee_id`) only applies to an open insert, and the window guard
   * (422 `time_out`) only applies when a `time_out` is given — the two are
   * mutually exclusive, so they never compete.
   */
  async create(input: {
    employee_id: number;
    work_date: string;
    time_in: Date;
    time_out?: Date | null;
    source?: TimeEntrySource;
    notes?: string | null;
    created_by?: number | null;
  }): Promise<TimeEntryRecord> {
    const willBeOpen = (input.time_out ?? null) == null;

    if (willBeOpen) {
      const existingOpen = await this.repository.findOpenForEmployee(input.employee_id);
      if (existingOpen) {
        throw unprocessable(
          'employee_id',
          `Employee ${input.employee_id} already has an open time entry (id ${existingOpen.id})`,
        );
      }
    }

    const window = this.validateWindow(input.time_in, input.time_out ?? null, 'time_out');
    const status = TimeEntry.deriveStatus(window);

    try {
      const created = await this.repository.create({
        employee_id: input.employee_id,
        work_date: input.work_date,
        time_in: input.time_in,
        time_out: input.time_out ?? null,
        source: input.source ?? TIME_ENTRY_SOURCES.admin,
        status,
        notes: input.notes ?? null,
        created_by: input.created_by ?? null,
      });
      this.publisher.publish([
        new TimeEntryOpened(created.id, created.employee_id, created.work_date),
      ]);
      return created;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          `Employee ${input.employee_id} already has an open time entry — close it before creating another.`,
        );
      }
      throw err;
    }
  }

  /**
   * Admin edit. NOT an aggregate transition (decision #5): a thin use-case
   * patch — merge over the existing row, validate the merged window, derive
   * status, persist `{ ...patch, status }`. Records no event (an admin edit is
   * not a downstream timesheet fact). `time_out` merges with `!== undefined`
   * (not `??`) so a `time_out: null` patch clears it to `open`.
   */
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
  ): Promise<TimeEntryRecord> {
    const existing = await this.findById(id);

    const time_in = patch.time_in ?? existing.time_in;
    const time_out = patch.time_out !== undefined ? patch.time_out : existing.time_out;

    const window = this.validateWindow(time_in, time_out, 'time_out');
    const status = TimeEntry.deriveStatus(window);

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
   * Apply an approved time-correction request to the timesheet (decision #7 —
   * the frozen cross-module seam the `time-correction` module depends on). The
   * time-correction module owns the request lifecycle; this module owns the
   * `time_entries` write. Called from inside the correction-approval flow so
   * the status flip and the entry mutation commit together.
   *
   * - `target_entry_id` set   → update that row via the aggregate (source = 'correction').
   * - `target_entry_id` NULL  → create a new row (missed-punch), use-case creation.
   *
   * The signature, branch, the proposed-window 422, the TOCTOU 409, the
   * one-open 409, and the `23505` mapping are frozen. `work_date` + `updated_by`
   * ride on the persist patch use-case-side (decision #5) — they aren't
   * aggregate state, and `work_date` may move the entry's date.
   */
  async applyCorrection(input: {
    employee_id: number;
    target_entry_id: number | null;
    work_date: string;
    proposed_time_in: Date;
    proposed_time_out: Date | null;
    decided_by: number | null;
  }): Promise<TimeEntryRecord> {
    const window = this.validateWindow(
      input.proposed_time_in,
      input.proposed_time_out,
      'proposed_time_out',
    );
    const status = TimeEntry.deriveStatus(window);
    const willBeOpen = window.isOpen();

    if (input.target_entry_id != null) {
      const target = await this.repository.findById(input.target_entry_id);
      if (!target || target.deleted_at) {
        throw new NotFoundException(
          `Target time entry ${input.target_entry_id} not found or deleted`,
        );
      }
      if (willBeOpen) await this.assertNoOtherOpenEntry(input.employee_id, input.target_entry_id);

      const aggregate = TimeEntry.reconstitute(target);
      aggregate.applyCorrection(window);

      const saved = await this.repository.update(input.target_entry_id, {
        work_date: input.work_date,
        time_in: aggregate.time_in,
        time_out: aggregate.time_out,
        source: aggregate.source,
        status: aggregate.status,
        updated_by: input.decided_by,
      });
      this.publisher.publish(aggregate.pullEvents());
      return saved;
    }

    // Authoritative TOCTOU guard: a manual-add ("Add Logs") may have been
    // submitted while the day had no entry, then an entry appeared before the
    // approver acted. Two confirmed entries on one day are NOT caught by the
    // open-only partial unique index, so block the duplicate here.
    if (await this.repository.existsForEmployeeDate(input.employee_id, input.work_date)) {
      throw conflict(
        'work_date',
        `Employee ${input.employee_id} already has a time entry on ${input.work_date}.`,
      );
    }

    if (willBeOpen) await this.assertNoOtherOpenEntry(input.employee_id, null);

    try {
      const created = await this.repository.create({
        employee_id: input.employee_id,
        work_date: input.work_date,
        time_in: input.proposed_time_in,
        time_out: input.proposed_time_out ?? null,
        source: TIME_ENTRY_SOURCES.correction,
        status,
        created_by: input.decided_by,
      });
      this.publisher.publish([
        new TimeEntryOpened(created.id, created.employee_id, created.work_date),
      ]);
      return created;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          'conflict',
          `Employee ${input.employee_id} already has an open time entry on this date.`,
        );
      }
      throw err;
    }
  }

  /**
   * Validate a window via the aggregate's pure guard and map the domain error
   * to the same 422 the pre-DDD service emitted. Returns the validated
   * `TimeWindow` so the caller derives status without rebuilding it.
   */
  private validateWindow(time_in: Date, time_out: Date | null, field: string): TimeWindow {
    try {
      return TimeEntry.assertWindow(time_in, time_out, field);
    } catch (err) {
      rethrowTimeEntryDomainError(err);
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
      throw conflict(
        'conflict',
        `Employee ${employee_id} already has an open time entry (id ${open.id}).`,
      );
    }
  }
}

/**
 * Translate a pure domain error from the `TimeEntry` aggregate / `TimeWindow`
 * value object into the exact HTTP exception the service threw before the DDD
 * migration (decision #8), so the wire contract is unchanged. Anything else is
 * rethrown untouched.
 */
function rethrowTimeEntryDomainError(err: unknown): never {
  if (err instanceof InvalidTimeWindowError) throw unprocessable(err.field, err.message);
  throw err;
}
