import { UserSearchHistory } from '@/user-search-histories/domain/user-search-history';
import { UserSearchHistoryEntity } from '@/user-search-histories/persistence/entities/user-search-history.entity';

export class UserSearchHistoryMapper {
  static toDomain(entity: UserSearchHistoryEntity): UserSearchHistory {
    const domain = new UserSearchHistory();
    domain.id = entity.id;
    domain.user_id = entity.user_id;
    domain.keyword = entity.keyword;
    domain.created_by = entity.created_by ?? null;
    domain.updated_by = entity.updated_by ?? null;
    domain.deleted_by = entity.deleted_by ?? null;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    domain.deleted_at = entity.deleted_at ?? null;
    return domain;
  }

  static toEntity(domain: UserSearchHistory): UserSearchHistoryEntity {
    const entity = new UserSearchHistoryEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.user_id = domain.user_id;
    entity.keyword = domain.keyword;
    entity.created_by = domain.created_by ?? null;
    entity.updated_by = domain.updated_by ?? null;
    entity.deleted_by = domain.deleted_by ?? null;
    entity.created_at = domain.created_at;
    entity.updated_at = domain.updated_at;
    entity.deleted_at = domain.deleted_at ?? null;
    return entity;
  }
}
