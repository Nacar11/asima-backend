import { MembershipBillingPeriod } from '../domain/membership-billing-period';
import { QueryMembershipBillingPeriodDto } from '../dto/query-membership-billing-period.dto';
import { FindAllMembershipBillingPeriod } from '../domain/find-all-membership-billing-period';
import { User } from '@/users/domain/user';

/**
 * Abstract base repository for membership billing periods.
 */
export abstract class BaseMembershipBillingPeriodRepository {
  /**
   * Create a new membership billing period.
   */
  abstract create(
    data: MembershipBillingPeriod,
  ): Promise<MembershipBillingPeriod>;

  /**
   * Find all membership billing periods with filters and pagination.
   */
  abstract findAll(
    query: QueryMembershipBillingPeriodDto,
  ): Promise<FindAllMembershipBillingPeriod>;

  /**
   * Find membership billing period by ID.
   */
  abstract findById(id: number): Promise<MembershipBillingPeriod | null>;

  /**
   * Update membership billing period.
   */
  abstract update(
    id: number,
    data: Partial<MembershipBillingPeriod>,
  ): Promise<MembershipBillingPeriod>;

  /**
   * Soft delete membership billing period.
   */
  abstract remove(id: number, deletedBy?: User): Promise<void>;
}
