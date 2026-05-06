import { FindAllUserPermissionsDto } from '@/user-permissions/dto/find-all-user-permissions.dto';
import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { UserPermission } from '@/user-permissions/domain/user-permission';

export abstract class BaseUserPermissionRepository {
  abstract create(
    data: Omit<UserPermission, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<UserPermission>;

  abstract findAllWithPagination({
    group,
    menu,
    status,
    paginationOptions,
  }: {
    group: FindAllUserPermissionsDto['group'];
    menu: FindAllUserPermissionsDto['menu'];
    status: FindAllUserPermissionsDto['status'] | 'all';
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<UserPermission>>;

  abstract findById(
    id: UserPermission['id'],
  ): Promise<NullableType<UserPermission>>;

  abstract findByIds(ids: UserPermission['id'][]): Promise<UserPermission[]>;

  abstract findAll(): Promise<UserPermission[]>;

  abstract update(
    id: UserPermission['id'],
    payload: DeepPartial<UserPermission>,
    includeSoftDelete?: boolean, // to include soft-deleted records
  ): Promise<UserPermission | null>;

  abstract remove(id: UserPermission['id']): Promise<void>;

  abstract getUserGroupPermissions(groupIds: Array<number>);
}
