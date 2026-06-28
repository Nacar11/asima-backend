import { Compensation } from '@/compensation/domain/compensation.aggregate';
import { CompensationRecord } from '@/compensation/domain/compensation';
import {
  FutureEffectiveDateError,
  InvalidPayRateError,
} from '@/compensation/domain/compensation-errors';
import { deriveHourlyRate, COMPENSATION_CURRENCY } from '@/compensation/compensation.constants';

const base = (): CompensationRecord => ({
  id: 7,
  employee_id: 12,
  monthly_salary: 50000,
  hourly_rate: deriveHourlyRate(50000),
  hourly_rate_is_overridden: false,
  currency: COMPENSATION_CURRENCY,
  effective_from: '2026-01-01',
  effective_to: null,
  created_by: 1,
  updated_by: 1,
  deleted_by: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  deleted_at: null,
});

describe('Compensation (aggregate)', () => {
  describe('reconstitute', () => {
    it('rebuilds a valid compensation row', () => {
      const agg = Compensation.reconstitute(base());
      expect(agg.id).toBe(7);
      expect(agg.employee_id).toBe(12);
      expect(agg.monthly_salary).toBe(50000);
      expect(agg.hourly_rate).toBe(deriveHourlyRate(50000));
      expect(agg.hourly_rate_is_overridden).toBe(false);
      expect(agg.effective_from).toBe('2026-01-01');
      expect(agg.effective_to).toBeNull();
    });

    it('throws on a corrupt row (negative monthly_salary) — fail-fast', () => {
      expect(() => Compensation.reconstitute({ ...base(), monthly_salary: -1 })).toThrow(
        InvalidPayRateError,
      );
    });
  });

  describe('assertNotFuture (static)', () => {
    it('passes when effective_from is on or before today', () => {
      expect(() => Compensation.assertNotFuture('2026-06-28', '2026-06-28')).not.toThrow();
      expect(() => Compensation.assertNotFuture('2026-01-01', '2026-06-28')).not.toThrow();
    });

    it('throws FutureEffectiveDateError when effective_from is after today', () => {
      try {
        Compensation.assertNotFuture('2026-06-29', '2026-06-28');
        throw new Error('expected assertNotFuture to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(FutureEffectiveDateError);
        expect((err as FutureEffectiveDateError).field).toBe('effective_from');
        expect((err as Error).message).toBe('effective_from cannot be in the future');
      }
    });
  });

  describe('correct', () => {
    const today = '2026-06-28';

    it('re-derives hourly and CLEARS the override on a salary change', () => {
      const agg = Compensation.reconstitute({
        ...base(),
        hourly_rate: 999,
        hourly_rate_is_overridden: true,
      });

      const patch = agg.correct({ monthly_salary: 60000 }, today, 4);

      expect(patch).toEqual({
        monthly_salary: 60000,
        hourly_rate: deriveHourlyRate(60000),
        hourly_rate_is_overridden: false,
        updated_by: 4,
      });
      // aggregate state reflects the correction
      expect(agg.monthly_salary).toBe(60000);
      expect(agg.hourly_rate).toBe(deriveHourlyRate(60000));
      expect(agg.hourly_rate_is_overridden).toBe(false);
    });

    it('uses an explicit hourly_rate verbatim and sets the override (explicit wins)', () => {
      const agg = Compensation.reconstitute(base());

      const patch = agg.correct({ monthly_salary: 60000, hourly_rate: 400 }, today, 4);

      expect(patch).toEqual({
        monthly_salary: 60000,
        hourly_rate: 400,
        hourly_rate_is_overridden: true,
        updated_by: 4,
      });
      expect(agg.hourly_rate).toBe(400);
      expect(agg.hourly_rate_is_overridden).toBe(true);
    });

    it('leaves the rate untouched when only effective_from is patched (S-1)', () => {
      const agg = Compensation.reconstitute(base());

      const patch = agg.correct({ effective_from: '2026-02-01' }, today, 4);

      expect(patch).toEqual({ effective_from: '2026-02-01', updated_by: 4 });
      expect(patch).not.toHaveProperty('hourly_rate');
      expect(patch).not.toHaveProperty('monthly_salary');
      expect(patch).not.toHaveProperty('hourly_rate_is_overridden');
      // rate unchanged on the aggregate
      expect(agg.monthly_salary).toBe(50000);
      expect(agg.hourly_rate).toBe(deriveHourlyRate(50000));
      expect(agg.effective_from).toBe('2026-02-01');
    });

    it('rejects a future-dated effective_from correction', () => {
      const agg = Compensation.reconstitute(base());
      expect(() => agg.correct({ effective_from: '2026-06-29' }, today, 4)).toThrow(
        FutureEffectiveDateError,
      );
    });

    it('records no domain events (Q#1 — the audit ledger is the trail)', () => {
      const agg = Compensation.reconstitute(base());
      agg.correct({ monthly_salary: 60000 }, today, 4);
      expect(agg.pullEvents()).toEqual([]);
    });
  });
});
