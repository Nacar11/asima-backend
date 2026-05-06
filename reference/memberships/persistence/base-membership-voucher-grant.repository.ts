import { DeepPartial } from 'typeorm';
import { NullableType } from '@/utils/types/nullable.type';
import { MembershipVoucherGrant } from '@/memberships/domain/membership-voucher-grant';
import { FindAllMembershipVoucherGrant } from '@/memberships/domain/find-all-membership-voucher-grant';
import { QueryMembershipVoucherGrantDto } from '@/memberships/dto/query-membership-voucher-grant.dto';
import { User } from '@/users/domain/user';

export abstract class BaseMembershipVoucherGrantRepository {
  abstract create(
    data: Omit<MembershipVoucherGrant, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<MembershipVoucherGrant>;
  abstract findAll(
    query: QueryMembershipVoucherGrantDto,
  ): Promise<FindAllMembershipVoucherGrant>;
  abstract findById(
    id: MembershipVoucherGrant['id'],
  ): Promise<NullableType<MembershipVoucherGrant>>;
  abstract findByMembershipId(
    membershipId: MembershipVoucherGrant['membership_id'],
  ): Promise<MembershipVoucherGrant[]>;
  abstract update(
    id: MembershipVoucherGrant['id'],
    payload: DeepPartial<MembershipVoucherGrant>,
  ): Promise<MembershipVoucherGrant>;
  abstract remove(
    id: MembershipVoucherGrant['id'],
    causer: User,
  ): Promise<void>;
}
