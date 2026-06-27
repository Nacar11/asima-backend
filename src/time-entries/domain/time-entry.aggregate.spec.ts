import { TimeEntry } from '@/time-entries/domain/time-entry.aggregate';
import { TimeEntryRecord } from '@/time-entries/domain/time-entry';
import { TimeWindow } from '@/time-entries/domain/value-objects/time-window';
import { InvalidTimeWindowError } from '@/time-entries/domain/time-entry-errors';
import {
  TimeEntryClosed,
  TimeEntryCorrected,
} from '@/time-entries/domain/events/time-entry-events';
import { TIME_ENTRY_SOURCES, TIME_ENTRY_STATUSES } from '@/time-entries/time-entries.constants';

const baseOpen = (): TimeEntryRecord => ({
  id: 10,
  employee_id: 12,
  work_date: '2026-05-07',
  time_in: new Date('2026-05-07T09:00:00.000Z'),
  time_out: null,
  source: TIME_ENTRY_SOURCES.manual,
  status: TIME_ENTRY_STATUSES.open,
  notes: null,
  created_by: 12,
  updated_by: 12,
  deleted_by: null,
  created_at: new Date('2026-05-07T09:00:00.000Z'),
  updated_at: new Date('2026-05-07T09:00:00.000Z'),
  deleted_at: null,
});

describe('TimeEntry (aggregate)', () => {
  describe('reconstitute', () => {
    it('rebuilds an open entry with a derived open status', () => {
      const agg = TimeEntry.reconstitute(baseOpen());
      expect(agg.status).toBe(TIME_ENTRY_STATUSES.open);
      expect(agg.time_out).toBeNull();
    });

    it('throws on a corrupt row (time_out <= time_in) — fail-fast on load', () => {
      const corrupt = { ...baseOpen(), time_out: new Date('2026-05-07T08:00:00.000Z') };
      expect(() => TimeEntry.reconstitute(corrupt)).toThrow(InvalidTimeWindowError);
    });
  });

  describe('close', () => {
    it('sets time_out, derives confirmed, and records TimeEntryClosed', () => {
      const agg = TimeEntry.reconstitute(baseOpen());
      const out = new Date('2026-05-07T17:00:00.000Z');

      agg.close(out);

      expect(agg.time_out).toBe(out);
      expect(agg.status).toBe(TIME_ENTRY_STATUSES.confirmed);
      const events = agg.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TimeEntryClosed);
      expect((events[0] as TimeEntryClosed).time_entry_id).toBe(10);
      expect((events[0] as TimeEntryClosed).employee_id).toBe(12);
    });

    it('throws when the close time is not strictly after time_in', () => {
      const agg = TimeEntry.reconstitute(baseOpen());
      expect(() => agg.close(new Date('2026-05-07T08:00:00.000Z'))).toThrow(InvalidTimeWindowError);
    });
  });

  describe('applyCorrection', () => {
    it('moves the window, marks source=correction, derives status, records TimeEntryCorrected', () => {
      const agg = TimeEntry.reconstitute(baseOpen());
      const newIn = new Date('2026-05-07T08:30:00.000Z');
      const newOut = new Date('2026-05-07T16:30:00.000Z');

      agg.applyCorrection(new TimeWindow(newIn, newOut));

      expect(agg.time_in).toBe(newIn);
      expect(agg.time_out).toBe(newOut);
      expect(agg.source).toBe(TIME_ENTRY_SOURCES.correction);
      expect(agg.status).toBe(TIME_ENTRY_STATUSES.confirmed);
      const events = agg.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TimeEntryCorrected);
      expect((events[0] as TimeEntryCorrected).time_entry_id).toBe(10);
    });

    it('a correction to an open window derives open status', () => {
      const confirmed = {
        ...baseOpen(),
        time_out: new Date('2026-05-07T17:00:00.000Z'),
        status: TIME_ENTRY_STATUSES.confirmed,
      };
      const agg = TimeEntry.reconstitute(confirmed);

      agg.applyCorrection(new TimeWindow(new Date('2026-05-07T09:00:00.000Z'), null));

      expect(agg.status).toBe(TIME_ENTRY_STATUSES.open);
      expect(agg.source).toBe(TIME_ENTRY_SOURCES.correction);
    });
  });

  describe('static deriveStatus / assertWindow', () => {
    const inAt = new Date('2026-05-07T09:00:00.000Z');

    it('deriveStatus maps open vs confirmed from the window', () => {
      expect(TimeEntry.deriveStatus(new TimeWindow(inAt, null))).toBe(TIME_ENTRY_STATUSES.open);
      expect(
        TimeEntry.deriveStatus(new TimeWindow(inAt, new Date('2026-05-07T10:00:00.000Z'))),
      ).toBe(TIME_ENTRY_STATUSES.confirmed);
    });

    it('assertWindow returns the validated window', () => {
      const w = TimeEntry.assertWindow(inAt, null);
      expect(w).toBeInstanceOf(TimeWindow);
      expect(w.isOpen()).toBe(true);
    });

    it('assertWindow re-labels the 422 error with the call-site field', () => {
      try {
        TimeEntry.assertWindow(inAt, new Date('2026-05-07T08:00:00.000Z'), 'proposed_time_out');
        throw new Error('expected assertWindow to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidTimeWindowError);
        expect((err as InvalidTimeWindowError).field).toBe('proposed_time_out');
        expect((err as Error).message).toBe(
          'proposed_time_out must be strictly after proposed_time_in',
        );
      }
    });
  });
});
