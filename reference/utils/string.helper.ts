export const safeTrim = <T extends string | null | undefined>(v: T): T =>
  typeof v === 'string' ? (v.trim() as T) : v;
