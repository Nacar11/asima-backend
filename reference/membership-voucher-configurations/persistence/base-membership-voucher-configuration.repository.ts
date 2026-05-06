import { DeepPartial } from 'typeorm';
import { NullableType } from '@/utils/types/nullable.type';
import { User } from '@/users/domain/user';
import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';
import { FindAllMembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/find-all-membership-voucher-configuration';
import { QueryMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/query-membership-voucher-configuration.dto';

export abstract class BaseMembershipVoucherConfigurationRepository {
  abstract create(
    data: Omit<
      MembershipVoucherConfiguration,
      'id' | 'created_at' | 'updated_at'
    >,
  ): Promise<MembershipVoucherConfiguration>;

  abstract findAll(
    query: QueryMembershipVoucherConfigurationDto,
  ): Promise<FindAllMembershipVoucherConfiguration>;

  abstract findById(
    id: MembershipVoucherConfiguration['id'],
  ): Promise<NullableType<MembershipVoucherConfiguration>>;

  abstract update(
    id: MembershipVoucherConfiguration['id'],
    payload: DeepPartial<MembershipVoucherConfiguration>,
  ): Promise<MembershipVoucherConfiguration>;

  abstract remove(
    id: MembershipVoucherConfiguration['id'],
    causer: User,
  ): Promise<void>;
}
