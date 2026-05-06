import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';

export type FindAllMembershipVoucherConfiguration = {
  data: MembershipVoucherConfiguration[];
  totalCount: number;
  skip: number;
  take: number;
};
