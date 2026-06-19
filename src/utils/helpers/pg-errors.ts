/**
 * Postgres unique-violation SQLSTATE. The partial unique indexes that
 * guard "at most one open punch / active schedule / …" raise this when a
 * concurrent write loses the race; services catch it and map the loser to
 * a friendly 409 (the DB index, not the service pre-check, is the source
 * of truth — see module-architecture §7).
 */
export const PG_UNIQUE_VIOLATION = '23505';

/** Narrow an unknown caught error to "Postgres unique-violation (23505)". */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === PG_UNIQUE_VIOLATION
  );
}
