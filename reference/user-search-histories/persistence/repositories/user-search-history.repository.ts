import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSearchHistoryEntity } from '@/user-search-histories/persistence/entities/user-search-history.entity';
import { BaseUserSearchHistoryRepository } from '@/user-search-histories/persistence/base-user-search-history.repository';
import { UserSearchHistory } from '@/user-search-histories/domain/user-search-history';
import { FindAllUserSearchHistory } from '@/user-search-histories/domain/find-all-user-search-history';
import { UserSearchHistoryMapper } from '@/user-search-histories/persistence/mappers/user-search-history.mapper';

@Injectable()
export class UserSearchHistoryRepository extends BaseUserSearchHistoryRepository {
  constructor(
    @InjectRepository(UserSearchHistoryEntity)
    private readonly repository: Repository<UserSearchHistoryEntity>,
  ) {
    super();
  }

  async create(domain: UserSearchHistory): Promise<UserSearchHistory> {
    const entity = UserSearchHistoryMapper.toEntity(domain);
    const saved = await this.repository.save(entity);
    return UserSearchHistoryMapper.toDomain(saved);
  }

  async deleteByUserAndKeyword(options: {
    userId: number;
    keyword: string;
  }): Promise<void> {
    const { userId, keyword } = options;
    await this.repository.delete({ user_id: userId, keyword });
  }

  async deleteByUser(userId: number): Promise<void> {
    await this.repository.delete({ user_id: userId });
  }

  async ensureMaxEntries(options: {
    userId: number;
    maxEntries: number;
  }): Promise<void> {
    const { userId, maxEntries } = options;
    const totalCount = await this.repository.count({
      where: { user_id: userId },
    });

    if (totalCount <= maxEntries) {
      return;
    }

    const toDelete = totalCount - maxEntries;
    const oldestEntries = await this.repository.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
      take: toDelete,
    });

    if (!oldestEntries.length) {
      return;
    }

    const idsToDelete = oldestEntries.map((entry) => entry.id);
    await this.repository.delete(idsToDelete);
  }

  async findAll(options: {
    skip?: number;
    take?: number;
    search?: string;
    userId?: number;
  }): Promise<FindAllUserSearchHistory> {
    const { skip = 0, take = 20, search, userId } = options;

    const qb = this.repository.createQueryBuilder('ush');

    if (userId) {
      qb.andWhere('ush.user_id = :userId', { userId });
    }

    if (search) {
      qb.andWhere('ush.keyword ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy('ush.created_at', 'DESC').skip(skip).take(take);

    const [rows, totalCount] = await qb.getManyAndCount();
    const data = rows.map((row) => UserSearchHistoryMapper.toDomain(row));

    return {
      data,
      totalCount,
      skip,
      take,
    };
  }
}
