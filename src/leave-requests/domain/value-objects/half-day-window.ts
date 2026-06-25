import { ValueObject } from '@/utils/domain/value-object';
import { DAY_PORTIONS, DayPortion } from '@/leave-requests/leave-requests.constants';

/**
 * Which slice of a day a request covers, with its snapshotted clock window.
 * Cohesive invariant: a `full` day has no window (both times null); a
 * `first_half` / `second_half` has a window with `start_time < end_time`
 * (HH:MM:SS, which compares lexicographically). Self-validating — an
 * inconsistent portion/window pair cannot exist. Pure TS.
 */
export class HalfDayWindow extends ValueObject<{
  portion: DayPortion;
  start_time: string | null;
  end_time: string | null;
}> {
  constructor(portion: DayPortion, start_time: string | null, end_time: string | null) {
    const isFull = portion === DAY_PORTIONS.full;
    if (isFull) {
      if (start_time !== null || end_time !== null) {
        throw new Error('A full-day portion must not carry a clock window.');
      }
    } else {
      if (start_time === null || end_time === null) {
        throw new Error(`A ${portion} portion requires a clock window.`);
      }
      if (start_time >= end_time) {
        throw new Error(`Half-day window start (${start_time}) must precede end (${end_time}).`);
      }
    }
    super({ portion, start_time, end_time });
  }

  get portion(): DayPortion {
    return this.props.portion;
  }

  get start_time(): string | null {
    return this.props.start_time;
  }

  get end_time(): string | null {
    return this.props.end_time;
  }

  isFull(): boolean {
    return this.props.portion === DAY_PORTIONS.full;
  }

  isHalf(): boolean {
    return !this.isFull();
  }
}
