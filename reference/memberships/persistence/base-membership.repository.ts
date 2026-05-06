import { DeepPartial } from 'typeorm';
import { NullableType } from '@/utils/types/nullable.type';
import { Membership } from '@/memberships/domain/membership';
import { FindAllMembership } from '@/memberships/domain/find-all-membership';
import { QueryMembershipDto } from '@/memberships/dto/query-membership.dto';
import { User } from '@/users/domain/user';

export abstract class BaseMembershipRepository {
  abstract create(
    data: Omit<Membership, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Membership>;
  abstract findAll(query: QueryMembershipDto): Promise<FindAllMembership>;
  abstract findById(id: Membership['id']): Promise<NullableType<Membership>>;
  abstract findLatestByUserId(
    userId: number,
  ): Promise<NullableType<Membership>>;
  abstract findActiveByUserId(
    userId: number,
  ): Promise<NullableType<Membership>>;
  abstract findActiveOrGraceByUserId(
    userId: number,
  ): Promise<NullableType<Membership>>;
  abstract update(
    id: Membership['id'],
    payload: DeepPartial<Membership>,
  ): Promise<Membership>;
  abstract remove(id: Membership['id'], causer: User): Promise<void>;
}
