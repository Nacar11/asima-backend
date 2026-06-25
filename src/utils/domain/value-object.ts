/**
 * Base class for Value Objects — immutable, self-validating, compared by
 * value not identity. Subclasses validate in their constructor (throwing a
 * domain error if the invariant is broken) so an invalid value object can
 * never exist. Pure TS: no `@nestjs/*`, no `typeorm`.
 *
 * Equality is structural and class-aware: two value objects are equal iff
 * they are the same subclass and their props are deeply equal.
 */
export abstract class ValueObject<TProps extends object> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze(props);
  }

  equals(other?: ValueObject<TProps>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return deepEquals(this.props, other.props);
  }
}

function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}
