// import { StatusEnum } from '@/user-groups/user-groups.enum';
// import { FindAllUserGroupsDto } from '@/user-groups/dto/find-all-user-groups.dto';
import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
// import { IPaginationOptions } from '@/utils/types/pagination-options';
// import { IPaginatedResult } from '@/utils/types/paginated-result';
import { UserGroup } from '@/user-groups/domain/user-group';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

export abstract class BaseUserGroupRepository {
  abstract create(
    data: Omit<UserGroup, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<UserGroup>;

  abstract findManyBy(
    loadOptions: GetQueryParams,
  ): Promise<{ data: UserGroup[]; totalCount: number }>;

  abstract findById(id: UserGroup['id']): Promise<NullableType<UserGroup>>;

  abstract findByIds(ids: UserGroup['id'][]): Promise<UserGroup[]>;

  abstract findAll(): Promise<Pick<UserGroup, 'group_name' | 'description'>[]>;

  abstract findByName(name: string): Promise<NullableType<UserGroup>>;

  abstract findCustomerGroup(): Promise<NullableType<UserGroup>>;

  abstract update(
    id: UserGroup['id'],
    payload: DeepPartial<UserGroup>,
  ): Promise<UserGroup | null>;

  abstract remove(id: UserGroup['id'], causer: { id: number }): Promise<void>;
}
