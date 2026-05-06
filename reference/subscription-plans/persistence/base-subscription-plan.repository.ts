import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { SubscriptionPlan } from '@/subscription-plans/domain/subscription-plan';
import { QuerySubscriptionPlanDto } from '@/subscription-plans/dto/query-subscription-plan.dto';
import { User } from '@/users/domain/user';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { DeepPartial } from 'typeorm';

export abstract class BaseSubscriptionPlanRepository {
  abstract create(
    data: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<SubscriptionPlan>;

  abstract findAllWithPagination(params: {
    filterQuery?: QuerySubscriptionPlanDto;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SubscriptionPlan>>;

  abstract findById(
    id: SubscriptionPlan['id'],
  ): Promise<NullableType<SubscriptionPlan>>;

  abstract findByCode(
    plan_code: SubscriptionPlan['plan_code'],
  ): Promise<NullableType<SubscriptionPlan>>;

  abstract findByIds(
    ids: SubscriptionPlan['id'][],
  ): Promise<SubscriptionPlan[]>;

  abstract findActive(): Promise<SubscriptionPlan[]>;

  abstract update(
    id: SubscriptionPlan['id'],
    payload: DeepPartial<SubscriptionPlan>,
  ): Promise<SubscriptionPlan>;

  abstract remove(id: SubscriptionPlan['id'], causer: User): Promise<void>;

  abstract lookup(loadOptions: LookUpDto): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;
}
