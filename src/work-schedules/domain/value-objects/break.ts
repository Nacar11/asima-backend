import { ValueObject } from '@/utils/domain/value-object';
import { InvalidBreakError } from '@/work-schedules/domain/work-schedule-errors';

/**
 * The unpaid break of a work schedule: a `break_minutes` length plus an
 * optional `break_start` (zero-padded `HH:MM:SS`). Standalone invariants:
 * `break_minutes >= 0`, and `break_start` is **required** when the break has
 * length. Homes the standalone half of the service's `assertBreakOk`.
 *
 * The window-relative rule ("the break fits inside the work window") spans this
 * VO and `WorkWindow`, so it lives on the `WorkSchedule` aggregate
 * (`assertBreakWithinWindow`), not here.
 *
 * Self-validating. Pure TS: no `@nestjs/*`, no `typeorm`.
 */
export class Break extends ValueObject<{ break_minutes: number; break_start: string | null }> {
  constructor(break_minutes: number, break_start: string | null) {
    if (break_minutes < 0) {
      throw new InvalidBreakError('break_minutes', 'break_minutes must be >= 0');
    }
    if (break_minutes > 0 && break_start == null) {
      throw new InvalidBreakError('break_start', 'break_start is required when break_minutes > 0');
    }
    super({ break_minutes, break_start });
  }

  get break_minutes(): number {
    return this.props.break_minutes;
  }

  get break_start(): string | null {
    return this.props.break_start;
  }

  /** True when a break window is present (a `break_start` to validate/fit). */
  hasBreak(): boolean {
    return this.props.break_start != null;
  }
}
