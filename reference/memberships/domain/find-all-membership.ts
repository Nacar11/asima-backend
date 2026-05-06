import { MembershipListItem } from '@/memberships/domain/membership-list-item';

export type FindAllMembership = {
  data: MembershipListItem[];
  totalCount: number;
  skip: number;
  take: number;
  members_count: number;
  active_members: number;
  total_revenue: number;
  churn_rate: number;
};
