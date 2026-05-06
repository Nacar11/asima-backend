import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CostCenter } from '@/masters/cost-centers/domain/cost-center';
import { FindAllCostCentersDto } from '@/masters/cost-centers/dto/find-all-cost-centers.dto';
import { User } from '@/users/domain/user';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { DeepPartial, QueryRunner } from 'typeorm';

/**
 * Abstract base repository for cost center data operations.
 *
 * This abstract class defines the contract for cost center repository implementations,
 * providing a consistent interface for all data access operations. It includes
 * methods for CRUD operations, advanced filtering, pagination, and lookup functionality.
 *
 * The repository pattern ensures separation of concerns between business logic
 * and data access, making the codebase more maintainable and testable.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * class CostCenterRepository extends BaseCostCenterRepository {
 *   async create(data: Omit<CostCenter, 'id' | 'created_at' | 'updated_at'>): Promise<CostCenter> {
 *     // Implementation here
 *   }
 * }
 * ```
 */
export abstract class BaseCostCenterRepository {
  /**
   * Creates a new cost center in the database.
   *
   * @param data - Cost center data without auto-generated fields
   * @returns Promise<CostCenter> - The created cost center entity
   */
  abstract create(
    data: Omit<CostCenter, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<CostCenter>;

  /**
   * Retrieves cost centers with DevExtreme-compatible filtering and pagination.
   *
   * @param loadOptions - DevExtreme query parameters for filtering and pagination
   * @returns Promise<DevExtremePaginatedResponseDto<CostCenter>> - Paginated cost centers response
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<CostCenter>>;

  /**
   * Retrieves cost centers with standard pagination and filtering.
   *
   * @param filterQuery - Search term to filter cost centers
   * @param paginationOptions - Pagination options including page, limit, and status filter
   * @returns Promise<IPaginatedResult<CostCenter>> - Paginated cost centers result
   */
  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllCostCentersDto['search'];
    paginationOptions: IPaginationOptions & { status: StatusEnum[] | 'all' };
  }): Promise<IPaginatedResult<CostCenter>>;

  /**
   * Retrieves a cost center by its unique identifier.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise<NullableType<CostCenter>> - The cost center entity or null if not found
   */
  abstract findById(id: CostCenter['id']): Promise<NullableType<CostCenter>>;

  /**
   * Retrieves a cost center by ID or throws an exception if not found.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise<CostCenter> - The cost center entity
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   */
  abstract findByIdOrFail(id: CostCenter['id']): Promise<CostCenter>;

  /**
   * Retrieves a cost center by its unique code.
   *
   * @param cost_center_code - The unique cost center code
   * @returns Promise<NullableType<CostCenter>> - The cost center entity or null if not found
   */
  abstract findByCode(
    cost_center_code: CostCenter['cost_center_code'],
  ): Promise<NullableType<CostCenter>>;

  /**
   * Retrieves all cost centers with basic information.
   *
   * @returns Promise<Pick<CostCenter, 'id' | 'cost_center_code' | 'cost_center_name'>[]> - Array of simplified cost center data
   */
  abstract findAll(): Promise<
    Pick<CostCenter, 'id' | 'cost_center_code' | 'cost_center_name'>[]
  >;

  /**
   * Retrieves all distinct cost center codes.
   *
   * @returns Promise<CostCenter[]> - Array of unique cost center entities
   */
  abstract findDistinct(): Promise<CostCenter[]>;

  /**
   * Retrieves multiple cost centers by their IDs.
   *
   * @param ids - Array of cost center IDs to retrieve
   * @returns Promise<CostCenter[]> - Array of cost center entities
   */
  abstract findByIds(ids: CostCenter['id'][]): Promise<CostCenter[]>;

  /**
   * Updates an existing cost center.
   *
   * @param id - The unique identifier of the cost center to update
   * @param payload - Partial cost center data to update
   * @returns Promise<CostCenter | null> - The updated cost center entity or null if not found
   */
  abstract update(
    id: CostCenter['id'],
    payload: Partial<CostCenter>,
  ): Promise<CostCenter | null>;

  /**
   * Soft deletes a cost center.
   *
   * @param id - The unique identifier of the cost center to delete
   * @param causer - The user performing the deletion
   * @returns Promise<void>
   */
  abstract remove(id: CostCenter['id'], causer: User): Promise<void>;

  /**
   * Performs a lookup search for cost centers with advanced filtering.
   *
   * @param loadOptions - Lookup query parameters with filtering options
   * @param exclude - Optional exclusion parameters for bulk operations
   * @returns Promise with lookup data and total count
   */
  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;

  abstract bulkUpdate(
    ids: CostCenter['id'][],
    payload: DeepPartial<CostCenter>,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
