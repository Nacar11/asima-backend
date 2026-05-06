import { MembershipPayment } from '@/memberships/domain/membership-payment';

export type FindAllMembershipPayment = {
  data: MembershipPayment[];
  totalCount: number;
  skip: number;
  take: number;
};
