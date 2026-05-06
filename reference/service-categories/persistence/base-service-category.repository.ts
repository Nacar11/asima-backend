import { ServiceCategory } from '@/service-categories/domain/service-category';
import { QueryServiceCategoryDto } from '@/service-categories/dto/query-service-category.dto';

export abstract class BaseServiceCategoryRepository {
  abstract create(
    data: Omit<
      ServiceCategory,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<ServiceCategory>;

  abstract findAll(
    query: QueryServiceCategoryDto,
  ): Promise<{ data: ServiceCategory[]; totalCount: number }>;

  abstract findById(id: number): Promise<ServiceCategory | null>;

  abstract findByCode(code: string): Promise<ServiceCategory | null>;

  abstract findFeatured(
    limit?: number,
  ): Promise<{ data: ServiceCategory[]; totalCount: number }>;

  abstract lookup(
    search?: string,
    take?: number,
    skip?: number,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;

  abstract update(
    id: number,
    payload: Partial<ServiceCategory>,
  ): Promise<ServiceCategory>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
