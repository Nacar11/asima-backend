import { ValueObject } from '@/utils/domain/value-object';

type PointProps = { x: number; y: number };
class Point extends ValueObject<PointProps> {
  constructor(props: PointProps) {
    super(props);
  }
  get x(): number {
    return this.props.x;
  }
}

type OtherProps = { x: number; y: number };
class Other extends ValueObject<OtherProps> {
  constructor(props: OtherProps) {
    super(props);
  }
}

describe('ValueObject', () => {
  it('treats two instances with equal props as equal', () => {
    expect(new Point({ x: 1, y: 2 }).equals(new Point({ x: 1, y: 2 }))).toBe(true);
  });

  it('treats instances with differing props as not equal', () => {
    expect(new Point({ x: 1, y: 2 }).equals(new Point({ x: 9, y: 2 }))).toBe(false);
  });

  it('treats different subclasses with identical props as not equal', () => {
    const point = new Point({ x: 1, y: 2 });
    const other = new Other({ x: 1, y: 2 });
    expect(point.equals(other as unknown as Point)).toBe(false);
  });

  it('is not equal to null/undefined', () => {
    expect(new Point({ x: 1, y: 2 }).equals(undefined)).toBe(false);
  });

  it('freezes its props so a value object is immutable', () => {
    const point = new Point({ x: 1, y: 2 });
    expect(() => {
      (point as unknown as { props: PointProps }).props.x = 99;
    }).toThrow();
    expect(point.x).toBe(1);
  });
});
