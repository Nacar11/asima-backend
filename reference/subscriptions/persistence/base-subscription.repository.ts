import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Subscription } from '@/subscriptions/domain/subscription';
import { QuerySubscriptionDto } from '@/subscriptions/dto/query-subscription.dto';
import { User } from '@/users/domain/user';
import { DeepPartial } from 'typeorm';

export abstract class BaseSubscriptionRepository {
  abstract create(
    data: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Subscription>;

  abstract findAllWithPagination(params: {
    filterQuery?: QuerySubscriptionDto;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Subscription>>;

  abstract findById(
    id: Subscription['id'],
  ): Promise<NullableType<Subscription>>;

  abstract findByNumber(
    subscription_number: Subscription['subscription_number'],
  ): Promise<NullableType<Subscription>>;

  abstract findByUserId(user_id: number): Promise<Subscription[]>;

  abstract findActiveByUserId(
    user_id: number,
  ): Promise<NullableType<Subscription>>;

  abstract update(
    id: Subscription['id'],
    payload: DeepPartial<Subscription>,
  ): Promise<Subscription>;

  abstract remove(id: Subscription['id'], causer: User): Promise<void>;
}
