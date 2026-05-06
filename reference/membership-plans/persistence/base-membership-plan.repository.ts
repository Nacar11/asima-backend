import { MembershipPlan } from '../domain/membership-plan';
import { QueryMembershipPlanDto } from '../dto/query-membership-plan.dto';
import { FindAllMembershipPlan } from '../domain/find-all-membership-plan';
import { User } from '@/users/domain/user';

/**
 * Abstract base repository for membership plans.
 */
export abstract class BaseMembershipPlanRepository {
  /**
   * Create a new membership plan.
   */
  abstract create(data: MembershipPlan): Promise<MembershipPlan>;

  /**
   * Find all membership plans with filters and pagination.
   */
  abstract findAll(
    query: QueryMembershipPlanDto,
  ): Promise<FindAllMembershipPlan>;

  /**
   * Find membership plan by ID.
   */
  abstract findById(id: number): Promise<MembershipPlan | null>;

  /**
   * Update membership plan.
   */
  abstract update(
    id: number,
    data: Partial<MembershipPlan>,
  ): Promise<MembershipPlan>;

  /**
   * Soft delete membership plan.
   */
  abstract remove(id: number, deletedBy?: User): Promise<void>;
}
