import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';

export abstract class BaseUserAssignmentRepository {
  abstract create(
    data: Omit<UserAssignment, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<UserAssignment>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<UserAssignment>>;

  abstract findById(
    id: UserAssignment['id'],
  ): Promise<NullableType<UserAssignment>>;

  abstract findByIds(ids: UserAssignment['id'][]): Promise<UserAssignment[]>;

  abstract findAll(): Promise<Pick<UserAssignment, 'id' | 'group' | 'user'>[]>;

  abstract update(
    id: UserAssignment['id'],
    payload: DeepPartial<UserAssignment>,
  ): Promise<UserAssignment | null>;

  abstract remove(id: UserAssignment['id']): Promise<void>;

  abstract removeByIds(ids: UserAssignment['id'][]): Promise<void>;

  abstract removeByUserAndGroup(userId: number, groupId: number): Promise<void>;

  abstract findActiveByUserId(userId: number): Promise<UserAssignment[]>;
}
