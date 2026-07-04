/**
 * Port for the refresh-token revocation ledger (ADR 0002). `AuthService`
 * depends on this abstract class; the concrete `RefreshTokenRepository` binds
 * to it in the persistence module, and unit tests mock it.
 */
export abstract class BaseRefreshTokenRepository {
  /** Insert a new active refresh-token row (on login and on rotation). */
  abstract issue(input: { user_id: number; jti: string; expires_at: Date }): Promise<void>;

  /** True iff a row for `jti` exists, is not revoked, and has not expired. */
  abstract isActive(jti: string): Promise<boolean>;

  /**
   * Atomically revoke the row for `jti` **iff it is currently active**. Returns
   * true when THIS call flipped an active row to revoked (affected 1), false if
   * it was already revoked/absent. The `false` case is how rotation detects
   * refresh-token reuse under concurrency — the caller maps it to 401.
   */
  abstract revokeIfActive(jti: string): Promise<boolean>;

  /** Revoke every active refresh token for a user (logout / revoke-all). */
  abstract revokeAllForUser(user_id: number): Promise<void>;

  /** Hard-delete rows already expired as of `asOf`. Returns rows removed. */
  abstract deleteExpired(asOf: Date): Promise<number>;
}
