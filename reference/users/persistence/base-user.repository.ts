import { NullableType } from '@/utils/types/nullable.type';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { UserLookupDto } from '@/users/dto/user-lookup.dto';
import { DeepPartial, QueryRunner } from 'typeorm';

export abstract class BaseUserRepository {
  abstract create(
    data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<User>;

  abstract findManyBy(
    loadOptions: GetQueryParams,
  ): Promise<{ data: User[]; totalCount: number }>;

  abstract findById(id: User['id']): Promise<NullableType<User>>;

  abstract findOneBy(conditions: Record<string, any>): Promise<User>;

  abstract findByUserId(id: User['user_id']): Promise<NullableType<User>>;

  abstract findByIds(ids: User['id'][]): Promise<User[]>;

  abstract findByEmail(email: User['email']): Promise<NullableType<User>>;

  abstract findByIdWithCredentials(id: User['id']): Promise<NullableType<User>>;

  abstract findByEmailWithCredentials(
    email: User['email'],
  ): Promise<NullableType<User>>;

  abstract findAll(): Promise<
    Pick<User, 'id' | 'first_name' | 'middle_name' | 'last_name' | 'user_id'>[]
  >;

  abstract findEligibleSellerUsers(): Promise<
    Pick<User, 'id' | 'first_name' | 'middle_name' | 'last_name'>[]
  >;

  abstract update(id: User['id'], payload: Partial<User>): Promise<User | null>;

  abstract remove(id: User['id'], causer: User | null): Promise<void>;

  abstract bulkRemove(materials: User[], causer: User | null): Promise<void>;

  abstract getUserGroupsFromAssignments(id: User['id']): Promise<string[]>;

  abstract getUserPermissions(
    id: User['id'],
  ): Promise<Record<string, any> | undefined>;

  abstract getUserCostCenter(id: User['id']): Promise<NullableType<User>>;

  abstract lookup(loadOptions: UserLookupDto): Promise<{
    data: {
      id: number;
      user_id: string;
      first_name: string;
      last_name: string;
      email: string;
    }[];
    totalCount: number;
  }>;

  abstract bulkUpdate(
    ids: User['id'][],
    payload: DeepPartial<User>,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
