import { User } from '@/users/domain/user';
import { UserSearchCriteria } from '@/users/domain/user-search-criteria';
import { FindAllUser } from '@/users/domain/find-all-user';
import { CreateUserPersistence, UpdateUserPatch } from '@/users/domain/user-inputs';

/**
 * Bundle of credential fields. Returned only by
 * `findByEmailWithCredentials` / `findByIdWithCredentials` — used by the
 * auth login flow and self-service password change to verify a password
 * without ever surfacing the hash through the domain layer.
 */
export type UserWithCredentials = {
  user: User;
  password_hash: string;
};

export abstract class BaseUserRepository {
  abstract findAll(criteria: UserSearchCriteria): Promise<FindAllUser>;

  abstract findById(id: number): Promise<User | null>;

  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Used by AuthService.login only. Loads the row WITH `password_hash`
   * via `addSelect`. Caller must compare and discard the hash; never
   * propagate it.
   */
  abstract findByEmailWithCredentials(email: string): Promise<UserWithCredentials | null>;

  /**
   * Used by self-service password change. Loads the row WITH
   * `password_hash` so the service can verify the caller's current
   * password before rotating. Same propagation rules as
   * `findByEmailWithCredentials` — discard the hash after compare.
   */
  abstract findByIdWithCredentials(id: number): Promise<UserWithCredentials | null>;

  /**
   * Case-insensitive existence check. Excludes soft-deleted rows so it
   * aligns with the partial unique index
   * (`users_email_lower_uq … WHERE deleted_at IS NULL`).
   */
  abstract existsByEmail(email: string): Promise<boolean>;

  abstract create(input: CreateUserPersistence): Promise<User>;

  /**
   * Partial update. `email` is intentionally NOT in `UpdateUserPatch` —
   * changing a login identity requires a verification flow that
   * doesn't exist yet, so neither the admin DTO nor this method
   * accepts it. Re-introduce a dedicated endpoint when the flow lands.
   *
   * Trusts that the caller (service layer) has already verified the
   * row exists — does NOT throw on missing id.
   */
  abstract update(id: number, patch: UpdateUserPatch): Promise<User>;

  /** Caller is responsible for hashing — repo just persists. */
  abstract updatePasswordHash(
    id: number,
    password_hash: string,
    updated_by: number | null,
  ): Promise<void>;

  abstract recordLogin(id: number, at: Date): Promise<void>;

  /** Trusts the caller has already verified the row exists. */
  abstract softDelete(id: number, deleted_by: number | null): Promise<void>;
}
