import { User } from '@/users/domain/user';
import { UserSearchCriteria } from '@/users/domain/user-search-criteria';
import { FindAllUser } from '@/users/domain/find-all-user';

/**
 * Bundle of credential fields. Returned only by
 * `findByEmailWithCredentials` — used by the auth login flow to verify a
 * password without ever surfacing the hash through the domain layer.
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

  abstract existsByEmail(email: string): Promise<boolean>;

  abstract create(input: {
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    title?: string | null;
    role_id: number;
    system_admin?: boolean;
    is_active?: boolean;
    created_by?: number | null;
  }): Promise<User>;

  abstract update(
    id: number,
    patch: {
      email?: string;
      first_name?: string;
      last_name?: string;
      title?: string | null;
      role_id?: number;
      system_admin?: boolean;
      is_active?: boolean;
      updated_by?: number | null;
    },
  ): Promise<User>;

  /** Caller is responsible for hashing — repo just persists. */
  abstract updatePasswordHash(
    id: number,
    password_hash: string,
    updated_by: number | null,
  ): Promise<void>;

  abstract recordLogin(id: number, at: Date): Promise<void>;

  abstract softDelete(id: number, deleted_by: number | null): Promise<void>;
}
