import { AggregateRoot } from '@/utils/domain/aggregate-root';
import { WorkWindow } from '@/work-schedules/domain/value-objects/work-window';
import { Break } from '@/work-schedules/domain/value-objects/break';
import { InvalidBreakError } from '@/work-schedules/domain/work-schedule-errors';
import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleEnded } from '@/work-schedules/domain/events/work-schedule-events';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { toSeconds } from '@/utils/helpers/time-of-day';

/**
 * The full persisted shape of a work schedule — the reconstitution input. It IS
 * the persisted record, so alias it rather than duplicate the field list.
 */
export type WorkScheduleProps = WorkScheduleRecord;

/**
 * Work-schedule aggregate root. The invariants that used to live as free
 * functions in `WorkSchedulesService` (`assertWindowOk` / `assertBreakOk`) are
 * here, on the `WorkWindow` + `Break` value objects plus the cross-VO
 * `assertBreakWithinWindow` guard.
 *
 * Deliberately lighter than the approval modules: no actor, no authz on the
 * aggregate (admin schedule routes are `@Permissions`-gated at the edge). The
 * one transition is the logical end (`endLogically`). The I/O guards
 * (one-active, already-ended, `23505`→409, 404) stay in the use-case.
 *
 * Pure TS — no `@nestjs/*`, no `typeorm` (`toSeconds` is a pure helper).
 */
export class WorkSchedule extends AggregateRoot {
  private readonly _window: WorkWindow;
  private readonly _break: Break;
  private _effective_to: string | null;

  private constructor(private readonly p: WorkScheduleProps) {
    super();
    // Building the VOs + cross-check validates — a corrupt row throws here on
    // load rather than producing a silently-invalid aggregate.
    this._window = new WorkWindow(p.expected_in, p.expected_out);
    this._break = new Break(p.break_minutes, p.break_start);
    WorkSchedule.assertBreakWithinWindow(this._window, this._break);
    this._effective_to = p.effective_to;
  }

  /** Rebuild the aggregate from a persisted record (validates the VOs). */
  static reconstitute(props: WorkScheduleProps): WorkSchedule {
    return new WorkSchedule(props);
  }

  /**
   * Validate a creation/patch schedule and **return** the validated VOs (so the
   * use-case persists without rebuilding). Throws domain errors that the
   * use-case — and the schedule-change cascade's `validate` — map to 422 via
   * the shared `rethrowFieldValidationError`.
   */
  static assertSchedule(
    expected_in: string,
    expected_out: string,
    break_minutes: number,
    break_start: string | null = null,
  ): { window: WorkWindow; brk: Break } {
    const window = new WorkWindow(expected_in, expected_out);
    const brk = new Break(break_minutes, break_start);
    WorkSchedule.assertBreakWithinWindow(window, brk);
    return { window, brk };
  }

  /**
   * Cross-VO rule (spans `WorkWindow` + `Break`): when a break is present it
   * must fit inside the window — start on/after `expected_in` and end on/before
   * `expected_out`. Homes the window-relative half of the legacy `assertBreakOk`.
   */
  static assertBreakWithinWindow(window: WorkWindow, brk: Break): void {
    if (!brk.hasBreak()) return;
    const startSec = toSeconds(brk.break_start as string);
    if (startSec < toSeconds(window.expected_in)) {
      throw new InvalidBreakError('break_start', 'break_start must be on or after expected_in');
    }
    if (startSec + brk.break_minutes * 60 > toSeconds(window.expected_out)) {
      throw new InvalidBreakError('break_start', 'the break must end on or before expected_out');
    }
  }

  // ── read accessors (what the use-case needs for the persist patch) ──
  get id(): number {
    return this.p.id;
  }
  get employee_id(): number {
    return this.p.employee_id;
  }
  get day_of_week(): DayOfWeek {
    return this.p.day_of_week;
  }
  get expected_in(): string {
    return this._window.expected_in;
  }
  get expected_out(): string {
    return this._window.expected_out;
  }
  get break_minutes(): number {
    return this._break.break_minutes;
  }
  get break_start(): string | null {
    return this._break.break_start;
  }
  get effective_from(): string {
    return this.p.effective_from;
  }
  get effective_to(): string | null {
    return this._effective_to;
  }

  // ── behavior ──
  /**
   * Logical end: stamp `effective_to` so the row stops being active but stays in
   * the table for historical reference; records `WorkScheduleEnded`. The
   * already-ended guard stays use-case-side (a read of current state → 409).
   */
  endLogically(effective_to: string): void {
    this._effective_to = effective_to;
    this.recordEvent(new WorkScheduleEnded(this.p.id, this.p.employee_id, effective_to));
  }
}
