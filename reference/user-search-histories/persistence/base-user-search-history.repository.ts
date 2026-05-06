import { UserSearchHistory } from '@/user-search-histories/domain/user-search-history';
import { FindAllUserSearchHistory } from '@/user-search-histories/domain/find-all-user-search-history';

/**
 * Abstract repository for user search history persistence operations.
 *
 * Follows the same pattern as BaseSellerRepository and BaseUserAddressRepository
 * by defining a domain-level contract without coupling to TypeORM.
 */
export abstract class BaseUserSearchHistoryRepository {
  /**
   * Create a new user search history entry.
   */
  abstract create(domain: UserSearchHistory): Promise<UserSearchHistory>;

  /**
   * Delete all entries for a given user and keyword (used for de-duplication).
   */
  abstract deleteByUserAndKeyword(options: {
    userId: number;
    keyword: string;
  }): Promise<void>;

  /**
   * Delete all entries for a given user (used by batchDelete/clear history).
   */
  abstract deleteByUser(userId: number): Promise<void>;

  /**
   * Ensure a user does not exceed the configured maximum number of entries.
   * Implementations should remove the oldest entries when over the limit.
   */
  abstract ensureMaxEntries(options: {
    userId: number;
    maxEntries: number;
  }): Promise<void>;

  /**
   * Find paginated search histories for a user.
   * Always ordered newest-first by created_at in concrete implementations.
   */
  abstract findAll(options: {
    skip?: number;
    take?: number;
    search?: string;
    userId?: number;
  }): Promise<FindAllUserSearchHistory>;
}
