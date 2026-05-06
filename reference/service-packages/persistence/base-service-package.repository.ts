import { ServicePackage } from '@/service-packages/domain/service-package';
import { QueryServicePackageDto } from '@/service-packages/dto/query-service-package.dto';

export abstract class BaseServicePackageRepository {
  abstract create(
    data: Omit<
      ServicePackage,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<ServicePackage>;

  abstract findAll(
    query: QueryServicePackageDto,
  ): Promise<{ data: ServicePackage[]; totalCount: number }>;

  abstract findById(id: number): Promise<ServicePackage | null>;

  abstract update(
    id: number,
    payload: Partial<ServicePackage>,
  ): Promise<ServicePackage>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
