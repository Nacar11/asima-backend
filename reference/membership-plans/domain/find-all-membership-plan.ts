import { MembershipPlan } from './membership-plan';

/**
 * Find all membership plans response type.
 */
export interface FindAllMembershipPlan {
  data: MembershipPlan[];
  totalCount: number;
  skip: number;
  take: number;
}
