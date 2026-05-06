import { ServiceOptionGroup } from '@/service-option-groups/domain/service-option-group';
import { QueryServiceOptionGroupDto } from '@/service-option-groups/dto/query-service-option-group.dto';

export abstract class BaseServiceOptionGroupRepository {
  abstract create(
    data: Omit<
      ServiceOptionGroup,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<ServiceOptionGroup>;

  abstract findAll(
    query: QueryServiceOptionGroupDto,
  ): Promise<{ data: ServiceOptionGroup[]; totalCount: number }>;

  abstract findById(id: number): Promise<ServiceOptionGroup | null>;

  abstract findByServiceId(serviceId: number): Promise<ServiceOptionGroup[]>;

  abstract findByServiceAndCode(
    serviceId: number,
    code: string,
    excludeId?: number,
  ): Promise<ServiceOptionGroup | null>;

  abstract update(
    id: number,
    payload: Partial<ServiceOptionGroup>,
  ): Promise<ServiceOptionGroup>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
