import { WorkSchedule } from '@/work-schedules/domain/work-schedule.aggregate';
import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleEnded } from '@/work-schedules/domain/events/work-schedule-events';
import {
  InvalidBreakError,
  InvalidWorkWindowError,
} from '@/work-schedules/domain/work-schedule-errors';
import { DAY_OF_WEEK } from '@/work-schedules/work-schedules.constants';

const base = (): WorkScheduleRecord => ({
  id: 5,
  employee_id: 12,
  day_of_week: DAY_OF_WEEK.MONDAY,
  expected_in: '09:00:00',
  expected_out: '18:00:00',
  break_minutes: 60,
  break_start: '12:00:00',
  effective_from: '2026-05-23',
  effective_to: null,
  created_by: 1,
  updated_by: 1,
  deleted_by: null,
  created_at: new Date('2026-05-23T00:00:00Z'),
  updated_at: new Date('2026-05-23T00:00:00Z'),
  deleted_at: null,
});

describe('WorkSchedule (aggregate)', () => {
  describe('reconstitute', () => {
    it('rebuilds a valid schedule', () => {
      const agg = WorkSchedule.reconstitute(base());
      expect(agg.id).toBe(5);
      expect(agg.expected_in).toBe('09:00:00');
      expect(agg.break_start).toBe('12:00:00');
      expect(agg.effective_to).toBeNull();
    });

    it('throws on a corrupt window (expected_out <= expected_in) — fail-fast', () => {
      expect(() =>
        WorkSchedule.reconstitute({ ...base(), expected_in: '18:00:00', expected_out: '09:00:00' }),
      ).toThrow(InvalidWorkWindowError);
    });

    it('throws on a corrupt break that overruns the window — fail-fast', () => {
      expect(() =>
        WorkSchedule.reconstitute({ ...base(), break_start: '17:30:00', break_minutes: 60 }),
      ).toThrow(InvalidBreakError);
    });
  });

  describe('endLogically', () => {
    it('stamps effective_to and records WorkScheduleEnded', () => {
      const agg = WorkSchedule.reconstitute(base());

      agg.endLogically('2026-06-30');

      expect(agg.effective_to).toBe('2026-06-30');
      const events = agg.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WorkScheduleEnded);
      expect((events[0] as WorkScheduleEnded).work_schedule_id).toBe(5);
      expect((events[0] as WorkScheduleEnded).effective_to).toBe('2026-06-30');
    });
  });

  describe('assertSchedule (static)', () => {
    it('returns the validated window + break for a valid schedule', () => {
      const { window, brk } = WorkSchedule.assertSchedule('09:00:00', '18:00:00', 60, '12:00:00');
      expect(window.expected_out).toBe('18:00:00');
      expect(brk.hasBreak()).toBe(true);
    });

    it('throws InvalidWorkWindowError when the window is inverted', () => {
      expect(() => WorkSchedule.assertSchedule('18:00:00', '09:00:00', 0, null)).toThrow(
        InvalidWorkWindowError,
      );
    });

    it('throws InvalidBreakError(break_start) when the break starts before expected_in', () => {
      try {
        WorkSchedule.assertSchedule('09:00:00', '18:00:00', 30, '08:00:00');
        throw new Error('expected assertSchedule to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidBreakError);
        expect((err as InvalidBreakError).field).toBe('break_start');
        expect((err as Error).message).toBe('break_start must be on or after expected_in');
      }
    });

    it('throws InvalidBreakError(break_start) when the break ends after expected_out', () => {
      try {
        WorkSchedule.assertSchedule('09:00:00', '18:00:00', 60, '17:30:00');
        throw new Error('expected assertSchedule to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidBreakError);
        expect((err as InvalidBreakError).field).toBe('break_start');
        expect((err as Error).message).toBe('the break must end on or before expected_out');
      }
    });

    it('allows a zero-minute break with no start (no within-window check)', () => {
      expect(() => WorkSchedule.assertSchedule('09:00:00', '18:00:00', 0, null)).not.toThrow();
    });
  });
});
