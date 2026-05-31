/**
 * Bcrypt cost factor used by UsersService and the user seeder.
 *
 * OWASP recommends ≥ 12 in 2026. Bcrypt's compare reads the cost from the
 * hash string itself, so mixed-cost hashes coexist safely — existing
 * 10-round hashes from earlier seeds keep working and auto-rotate to 12
 * the next time the user changes their password.
 */
export const BCRYPT_ROUNDS = 12;

/**
 * Password complexity policy enforced by every DTO that accepts a
 * cleartext password (`CreateUserDto`, `ResetUserPasswordDto`,
 * `ChangeMyPasswordDto`).
 *
 * Requires at least one lowercase letter, one uppercase letter, one
 * digit, and one symbol. Length bounds (min 8 / max 128) stay on the
 * DTO itself via `@MinLength` / `@MaxLength`.
 *
 * The regex is intentionally `.+` on the tail rather than constraining
 * the full character set — additional Unicode letters or accented
 * characters in passwords are fine, we only check that each required
 * class is present somewhere.
 */
export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one symbol.';

/**
 * Capitalize the first letter of a name, leaving the rest untouched.
 *
 * Silent normalization for `first_name` / `last_name`, applied in the
 * service layer (`UsersService.create` + `update`) so EVERY write path —
 * admin create, admin update, and self-service `/users/me` — gets the
 * same treatment. This mirrors the email `.trim().toLowerCase()`
 * normalization that already lives in the service, keeping all name/email
 * normalization in one place rather than spread across DTOs.
 *
 * First-letter-only by design: `'jane' → 'Jane'`, but legitimately
 * mixed-case names keep their internal casing (`'mcDONALD' → 'McDONALD'`,
 * `'o'brien' → 'O'brien'`). Whitespace is trimmed first so a leading
 * space can't swallow the capitalization.
 */
export function capitalizeFirstLetter(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
