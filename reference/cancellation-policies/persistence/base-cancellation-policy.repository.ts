import { NullableType } from '@/utils/types/nullable.type';
import { CancellationPolicy } from '@/cancellation-policies/domain/cancellation-policy';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { QueryCancellationPolicyDto } from '@/cancellation-policies/dto/query-cancellation-policy.dto';

export abstract class BaseCancellationPolicyRepository {
  abstract create(
    data: Partial<CancellationPolicy>,
  ): Promise<CancellationPolicy>;

  abstract findAll(
    query: QueryCancellationPolicyDto,
  ): Promise<IPaginatedResult<CancellationPolicy>>;

  abstract findById(id: number): Promise<NullableType<CancellationPolicy>>;

  abstract findBySellerId(sellerId: number): Promise<CancellationPolicy[]>;

  abstract findByServiceId(
    serviceId: number,
  ): Promise<NullableType<CancellationPolicy>>;

  abstract findDefault(): Promise<NullableType<CancellationPolicy>>;

  abstract update(
    id: number,
    data: Partial<CancellationPolicy>,
  ): Promise<CancellationPolicy>;

  abstract remove(id: number): Promise<void>;
}
