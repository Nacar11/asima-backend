import { PayRate } from '@/compensation/domain/value-objects/pay-rate';
import { InvalidPayRateError } from '@/compensation/domain/compensation-errors';
import { deriveHourlyRate } from '@/compensation/compensation.constants';

describe('PayRate', () => {
  describe('constructor invariants', () => {
    it('holds the three pay fields', () => {
      const rate = new PayRate(50000, 239.6128, false);
      expect(rate.monthly_salary).toBe(50000);
      expect(rate.hourly_rate).toBe(239.6128);
      expect(rate.hourly_rate_is_overridden).toBe(false);
    });

    it('accepts a zero monthly salary and zero hourly rate (the boundary)', () => {
      const rate = new PayRate(0, 0, false);
      expect(rate.monthly_salary).toBe(0);
      expect(rate.hourly_rate).toBe(0);
    });

    it('throws InvalidPayRateError keyed on monthly_salary when it is negative', () => {
      try {
        new PayRate(-1, 0, false);
        throw new Error('expected PayRate to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidPayRateError);
        expect((err as InvalidPayRateError).field).toBe('monthly_salary');
      }
    });

    it('throws InvalidPayRateError keyed on hourly_rate when it is negative', () => {
      try {
        new PayRate(50000, -1, true);
        throw new Error('expected PayRate to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidPayRateError);
        expect((err as InvalidPayRateError).field).toBe('hourly_rate');
      }
    });
  });

  describe('fromInput', () => {
    it('derives the hourly rate from the monthly salary when none is given (not overridden)', () => {
      const rate = PayRate.fromInput(50000);
      expect(rate.monthly_salary).toBe(50000);
      expect(rate.hourly_rate).toBe(deriveHourlyRate(50000));
      expect(rate.hourly_rate_is_overridden).toBe(false);
    });

    it('treats a null hourly_rate as "derive" (matches the create path\'s `!= null`)', () => {
      const rate = PayRate.fromInput(50000, null);
      expect(rate.hourly_rate).toBe(deriveHourlyRate(50000));
      expect(rate.hourly_rate_is_overridden).toBe(false);
    });

    it('uses an explicit hourly_rate verbatim and flags it overridden', () => {
      const rate = PayRate.fromInput(50000, 300);
      expect(rate.monthly_salary).toBe(50000);
      expect(rate.hourly_rate).toBe(300);
      expect(rate.hourly_rate_is_overridden).toBe(true);
    });

    it('rejects a negative explicit hourly_rate', () => {
      expect(() => PayRate.fromInput(50000, -5)).toThrow(InvalidPayRateError);
    });
  });
});
