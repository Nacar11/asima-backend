import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CostCenter } from '@/cost-centers/domain/cost-center';
import { FindAllCostCentersDto } from '@/cost-centers/dto/find-all-cost-centers.dto';
import { User } from '@/users/domain/user';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { DeepPartial, QueryRunner } from 'typeorm';

/**
 * Base Cost Center Repository Interface
 *
 * Abstract repository interface defining the contract for cost center data operations.
 * Provides a standardized interface for cost center persistence operations including
 * CRUD operations, pagination, filtering, and lookup functionality.
 *
 * This interface ensures consistent data access patterns across different
 * repository implementations and provides type safety for cost center operations.
 *
 * @example
 * ```typescript
 * class CostCenterRepository implements BaseCostCenterRepository {
 *   async findById(id: number): Promise<CostCenter | null> {
 *     // Implementation here
 *   }
 * }
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export abstract class BaseCostCenterRepository {
  abstract create(
    data: Omit<CostCenter, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<CostCenter>;

  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<CostCenter>>;

  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllCostCentersDto['search'];
    paginationOptions: IPaginationOptions & { status: StatusEnum[] | 'all' };
  }): Promise<IPaginatedResult<CostCenter>>;

  abstract findById(id: CostCenter['id']): Promise<NullableType<CostCenter>>;

  abstract findByIdOrFail(id: CostCenter['id']): Promise<CostCenter>;

  abstract findByCode(
    cost_center_code: CostCenter['cost_center_code'],
  ): Promise<NullableType<CostCenter>>;

  abstract findAll(): Promise<
    Pick<CostCenter, 'id' | 'cost_center_code' | 'cost_center_name'>[]
  >;

  abstract findDistinct(): Promise<CostCenter[]>;

  abstract findByIds(ids: CostCenter['id'][]): Promise<CostCenter[]>;

  abstract update(
    id: CostCenter['id'],
    payload: Partial<CostCenter>,
  ): Promise<CostCenter | null>;

  abstract bulkUpdate(
    ids: CostCenter['id'][],
    payload: DeepPartial<CostCenter>,
    queryRunner?: QueryRunner,
  ): Promise<void>;

  abstract remove(id: CostCenter['id'], causer: User): Promise<void>;

  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;
}
