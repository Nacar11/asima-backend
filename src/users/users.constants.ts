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
