import { DeepPartial } from 'typeorm';
import { NullableType } from '@/utils/types/nullable.type';
import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { FindAllMembershipPayment } from '@/memberships/domain/find-all-membership-payment';
import { QueryMembershipPaymentDto } from '@/memberships/dto/query-membership-payment.dto';
import { User } from '@/users/domain/user';

export abstract class BaseMembershipPaymentRepository {
  abstract create(
    data: Omit<MembershipPayment, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<MembershipPayment>;
  abstract findAll(
    query: QueryMembershipPaymentDto,
  ): Promise<FindAllMembershipPayment>;
  abstract findById(
    id: MembershipPayment['id'],
  ): Promise<NullableType<MembershipPayment>>;
  abstract findByMembershipId(
    membershipId: MembershipPayment['membership_id'],
  ): Promise<MembershipPayment[]>;
  abstract findByProviderReference(
    providerReference: string,
  ): Promise<NullableType<MembershipPayment>>;
  abstract update(
    id: MembershipPayment['id'],
    payload: DeepPartial<MembershipPayment>,
  ): Promise<MembershipPayment>;
  abstract remove(id: MembershipPayment['id'], causer: User): Promise<void>;
}
