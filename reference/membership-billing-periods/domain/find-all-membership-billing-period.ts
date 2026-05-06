import { MembershipBillingPeriod } from './membership-billing-period';

export type FindAllMembershipBillingPeriod = {
  data: MembershipBillingPeriod[];
  totalCount: number;
  skip: number;
  take: number;
};
