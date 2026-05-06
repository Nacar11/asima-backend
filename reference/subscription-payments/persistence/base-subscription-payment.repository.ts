import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { SubscriptionPayment } from '@/subscription-payments/domain/subscription-payment';
import { QuerySubscriptionPaymentDto } from '@/subscription-payments/dto/query-subscription-payment.dto';
import { User } from '@/users/domain/user';
import { DeepPartial } from 'typeorm';

export abstract class BaseSubscriptionPaymentRepository {
  abstract create(
    data: Omit<SubscriptionPayment, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<SubscriptionPayment>;

  abstract findAllWithPagination(params: {
    filterQuery?: QuerySubscriptionPaymentDto;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SubscriptionPayment>>;

  abstract findById(
    id: SubscriptionPayment['id'],
  ): Promise<NullableType<SubscriptionPayment>>;

  abstract findByNumber(
    payment_number: SubscriptionPayment['payment_number'],
  ): Promise<NullableType<SubscriptionPayment>>;

  abstract findBySubscriptionId(
    subscription_id: number,
  ): Promise<SubscriptionPayment[]>;

  abstract update(
    id: SubscriptionPayment['id'],
    payload: DeepPartial<SubscriptionPayment>,
  ): Promise<SubscriptionPayment>;

  abstract remove(id: SubscriptionPayment['id'], causer: User): Promise<void>;
}
