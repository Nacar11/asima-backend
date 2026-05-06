import { MembershipVoucherGrant } from '@/memberships/domain/membership-voucher-grant';

export type FindAllMembershipVoucherGrant = {
  data: MembershipVoucherGrant[];
  totalCount: number;
  skip: number;
  take: number;
};
