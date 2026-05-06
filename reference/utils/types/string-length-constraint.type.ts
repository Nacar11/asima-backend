/**
 * A utility type that computes all numbers less than a given number `N`.
 *
 * @typeParam N - The upper limit (exclusive) of the number range.
 * @typeParam Acc - An accumulator array used to build the range recursively (default is []).
 *
 * @example
 * type Result = LessThan<4>; // Result is 0 | 1 | 2 | 3
 */
export type LessThan<
  N extends number,
  Acc extends number[] = [],
> = Acc['length'] extends N ? never : Acc['length'] | LessThan<N, [...Acc, 0]>;

/**
 * A utility type that checks if a string type `T` has a length less than or equal to `L`.
 * If `T` is longer than `L`, the result is `never`.
 *
 * @typeParam T - The string type to check.
 * @typeParam L - The maximum allowed length of the string.
 *
 * @example
 * type A = MaxLength<'Hi', 3>; // 'Hi'
 * type B = MaxLength<'Hello', 3>; // never
 */
export type MaxLength<T extends string, L extends number> = T extends {
  length: infer N;
}
  ? N extends L | (number & LessThan<L>)
    ? T
    : never
  : never;
