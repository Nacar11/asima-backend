import { ServiceAddon } from '@/service-addons/domain/service-addon';
import { QueryServiceAddonDto } from '@/service-addons/dto/query-service-addon.dto';

export abstract class BaseServiceAddonRepository {
  abstract create(
    data: Omit<ServiceAddon, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<ServiceAddon>;

  abstract findAll(
    query: QueryServiceAddonDto,
  ): Promise<{ data: ServiceAddon[]; totalCount: number }>;

  abstract findById(id: number): Promise<ServiceAddon | null>;

  abstract findByServiceId(serviceId: number): Promise<ServiceAddon[]>;

  abstract findByServiceAndCode(
    serviceId: number,
    code: string,
    excludeId?: number,
  ): Promise<ServiceAddon | null>;

  abstract update(
    id: number,
    payload: Partial<ServiceAddon>,
  ): Promise<ServiceAddon>;

  abstract remove(id: number, causerId?: number): Promise<void>;

  abstract removeMany(ids: number[], causerId?: number): Promise<void>;

  abstract saveInclusions(
    addonId: number,
    inclusions: { id?: number; description: string; display_order: number }[],
  ): Promise<void>;
}
