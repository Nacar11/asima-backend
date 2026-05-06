import { ServiceOptionValue } from '@/service-option-values/domain/service-option-value';
import { QueryServiceOptionValueDto } from '@/service-option-values/dto/query-service-option-value.dto';

export abstract class BaseServiceOptionValueRepository {
  abstract create(
    data: Omit<ServiceOptionValue, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<ServiceOptionValue>;

  abstract findAll(
    query: QueryServiceOptionValueDto,
  ): Promise<{ data: ServiceOptionValue[]; totalCount: number }>;

  abstract findById(id: number): Promise<ServiceOptionValue | null>;

  abstract findByOptionGroupId(
    optionGroupId: number,
  ): Promise<ServiceOptionValue[]>;

  abstract findByGroupAndValue(
    optionGroupId: number,
    value: string,
    excludeId?: number,
  ): Promise<ServiceOptionValue | null>;

  abstract update(
    id: number,
    payload: Partial<ServiceOptionValue>,
  ): Promise<ServiceOptionValue>;

  abstract remove(id: number): Promise<void>;
}
