import { Membership } from '@/memberships/domain/membership';

export type MembershipListItem = Membership & {
  member_name: string;
  member_email: string;
  revenue: number;
  renewal_date: Date | null;
};
