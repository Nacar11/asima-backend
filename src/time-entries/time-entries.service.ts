import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseTimeEntryRepository } from '@/time-entries/persistence/base-time-entry.repository';
import { TimeEntry } from '@/time-entries/domain/time-entry';
import { TimeEntrySearchCriteria } from '@/time-entries/domain/time-entry-search-criteria';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import {
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
