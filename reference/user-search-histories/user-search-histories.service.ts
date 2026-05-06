import { Injectable, BadRequestException } from '@nestjs/common';
import { UserSearchHistoryRepository } from '@/user-search-histories/persistence/repositories/user-search-history.repository';
import { UserSearchHistory } from '@/user-search-histories/domain/user-search-history';
import { FindAllUserSearchHistory } from '@/user-search-histories/domain/find-all-user-search-history';
import { QueryUserSearchHistoryDto } from '@/user-search-histories/dto/query-user-search-history.dto';
import { User } from '@/users/domain/user';
import { RedisHelper } from '@/utils/helpers/redis.helper';

export type CreateUserSearchHistoryFromSearchParams = {
  user: User;
  keyword: string;
};

export type PopularSearchEntry = {
  keyword: string;
  score: number;
};

const POPULAR_SEARCHES_KEY = 'user_search_histories:popular_searches';
const POPULAR_SEARCHES_LIMIT = 10;

/**
 * Service for user search histories business logic.
 */
@Injectable()
export class UserSearchHistoriesService {
  constructor(
    private readonly repository: UserSearchHistoryRepository,
    private readonly redisHelper: RedisHelper,
  ) {}

  /**
   * Create a search history entry from a raw keyword and user.
   */
  async createFromSearch(
    params: CreateUserSearchHistoryFromSearchParams,
  ): Promise<UserSearchHistory> {
    const { user, keyword } = params;
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      throw new BadRequestException('Keyword must not be empty');
    }

    if (normalizedKeyword.length > 255) {
      throw new BadRequestException('Keyword must not exceed 255 characters');
    }

    await this.repository.deleteByUserAndKeyword({
      userId: user.id,
      keyword: normalizedKeyword,
    });

    const now = new Date();
    const domain = new UserSearchHistory();
    domain.user_id = user.id;
    domain.keyword = normalizedKeyword;
    domain.created_by = user.id;
    domain.updated_by = user.id;
    domain.created_at = now;
    domain.updated_at = now;

    const created = await this.repository.create(domain);

    await this.repository.ensureMaxEntries({
      userId: user.id,
      maxEntries: 100,
    });

    if (created) {
      await this.redisHelper.zIncrBy(
        POPULAR_SEARCHES_KEY,
        1,
        normalizedKeyword,
      );
    }

    return created;
  }

  /**
   * Get paginated search history entries for the current user.
   */
  async findAll(
    query: QueryUserSearchHistoryDto,
    currentUser: User,
  ): Promise<FindAllUserSearchHistory> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    return this.repository.findAll({
      skip,
      take,
      userId: currentUser.id,
    });
  }

  /**
   * Delete all search history entries for the current user.
   */
  async batchDelete(currentUser: User): Promise<void> {
    await this.repository.deleteByUser(currentUser.id);
  }

  async getAllPopularSearches(): Promise<PopularSearchEntry[]> {
    const entries = await this.redisHelper.zRevRange(
      POPULAR_SEARCHES_KEY,
      0,
      POPULAR_SEARCHES_LIMIT - 1,
    );

    return entries.map((entry) => ({
      keyword: entry.member,
      score: entry.score,
    }));
  }
}
