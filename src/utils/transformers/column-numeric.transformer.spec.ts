import { ColumnNumericTransformer } from '@/utils/transformers/column-numeric.transformer';

describe('ColumnNumericTransformer', () => {
  const t = new ColumnNumericTransformer();

  it('parses a pg numeric string to a JS number on the way out', () => {
    expect(t.from('0.5')).toBe(0.5);
    expect(typeof t.from('0.5')).toBe('number');
  });

  it('parses whole-day numeric strings too', () => {
    expect(t.from('3')).toBe(3);
    expect(t.from('10.0')).toBe(10);
  });

  it('passes null/undefined through unchanged', () => {
    expect(t.from(null)).toBeNull();
    expect(t.from(undefined)).toBeUndefined();
  });

  it('leaves the value untouched on the way in', () => {
    expect(t.to(0.5)).toBe(0.5);
    expect(t.to(null)).toBeNull();
  });
});
