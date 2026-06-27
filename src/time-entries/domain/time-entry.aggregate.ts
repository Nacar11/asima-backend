import { AggregateRoot } from '@/utils/domain/aggregate-root';
import { TimeWindow } from '@/time-entries/domain/value-objects/time-window';
import { InvalidTimeWindowError } from '@/time-entries/domain/time-entry-errors';
import { TimeEntryRecord } from '@/time-entries/domain/time-entry';
import {
  TimeEntryClosed,
  TimeEntryCorrected,
} from '@/time-entries/domain/events/time-entry-events';
import {
  TIME_ENTRY_SOURCES,
  TIME_ENTRY_STATUSES,
  TimeEntrySource,
  TimeEntryStatus,
} from '@/time-entries/time-entries.constants';

/**
 * The full persisted shape of a time entry — the reconstitution input. It IS
 * the persisted record, so alias it rather than duplicate the field list.
 */
export type TimeEntryProps = TimeEntryRecord;

/**
 * Time-entry aggregate root. The lifecycle rules that used to live in
 * `TimeEntriesService` are here, as behavior on the aggregate. The use-case
 * loads the record, reconstitutes, calls a behavior method, persists a narrow
 * patch, then publishes the buffered events.
 *
 * Deliberately lighter than leave / time-correction: there is **no actor** and
 * **no authz on the aggregate** (`time-entries` has no approval chain — punch
 * acts on self, admin routes are `@Permissions`-gated at the edge). The only
 * transition is open → confirmed; `status` is **derived** from the window, not
 * an independently-gated state. The I/O guards (cooldown, one-open, TOCTOU,
 * 23505→409, 404) stay in the use-case.
 *
 * Pure TS — no `@nestjs/*`, no `typeorm`.
 */
export class TimeEntry extends AggregateRoot {
  private _window: TimeWindow;
  private _source: TimeEntrySource;

  private constructor(private readonly p: TimeEntryProps) {
    super();
    // Building the window validates it — a corrupt row (time_out <= time_in)
    // throws here on load rather than producing a silently-invalid aggregate.
    this._window = new TimeWindow(p.time_in, p.time_out);
    this._source = p.source;
  }

  /** Rebuild the aggregate from a persisted record (validates the window). */
  static reconstitute(props: TimeEntryProps): TimeEntry {
    return new TimeEntry(props);
  }

  /**
   * Validate a creation/patch window and **return** the validated `TimeWindow`
   * (so callers derive status via `deriveStatus` without rebuilding it). The
   * insert-id-bound creation paths have no aggregate instance, so this is a
   * static guard, not a factory (§11 I/O-bound-creation deviation). `field`
   * rides on the 422 envelope — default `'time_out'`, `applyCorrection` passes
   * `'proposed_time_out'`.
   */
  static assertWindow(time_in: Date, time_out: Date | null = null, field = 'time_out'): TimeWindow {
    try {
      return new TimeWindow(time_in, time_out);
    } catch (err) {
      if (err instanceof InvalidTimeWindowError) throw new InvalidTimeWindowError(field);
      throw err;
    }
  }

  /** The single open↔confirmed derivation site (decision #3). */
  static deriveStatus(window: TimeWindow): TimeEntryStatus {
    return window.isOpen() ? TIME_ENTRY_STATUSES.open : TIME_ENTRY_STATUSES.confirmed;
  }

  // ── read accessors (what the use-case needs for the persist patch) ──
  get id(): number {
    return this.p.id;
  }
  get employee_id(): number {
    return this.p.employee_id;
  }
  get work_date(): string {
    return this.p.work_date;
  }
  get time_in(): Date {
    return this._window.time_in;
  }
  get time_out(): Date | null {
    return this._window.time_out;
  }
  get source(): TimeEntrySource {
    return this._source;
  }
  get notes(): string | null {
    return this.p.notes;
  }
  /** Derived from the window — never stored independently (decision #3). */
  get status(): TimeEntryStatus {
    return TimeEntry.deriveStatus(this._window);
  }

  // ── behavior ──
  /**
   * Punch-out / close: set `time_out` (must be strictly after `time_in`),
   * derive `confirmed`; records `TimeEntryClosed`. The use-case persists the
   * narrow patch `{ time_out, status, updated_by }`.
   */
  close(at: Date): void {
    this._window = new TimeWindow(this.time_in, at);
    this.recordEvent(new TimeEntryClosed(this.p.id, this.p.employee_id));
  }

  /**
   * Apply an approved correction to this (target) entry: move to the proposed
   * window, mark `source = correction`, status derived; records
   * `TimeEntryCorrected`. `work_date` + audit (`updated_by`) are persisted
   * use-case-side (decision #5) — they aren't aggregate state.
   */
  applyCorrection(window: TimeWindow): void {
    this._window = window;
    this._source = TIME_ENTRY_SOURCES.correction;
    this.recordEvent(new TimeEntryCorrected(this.p.id, this.p.employee_id));
  }
}
