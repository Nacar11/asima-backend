import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Division } from '@/masters/divisions/domain/division';
import { FindAllDivisionsDto } from '@/masters/divisions/dto/find-all-divisions.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';

/**
 * Abstract base repository for division data operations.
 *
 * This abstract class defines the contract for all division repository
 * implementations. It provides a consistent interface for division data
 * access operations including CRUD, pagination, filtering, and lookup.
 *
 * The repository pattern ensures separation of concerns between business
 * logic and data access, making the code more maintainable and testable.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * class DivisionRepository implements BaseDivisionRepository {
 *   async create(data: Division): Promise<Division> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class BaseDivisionRepository {
  /**
   * Creates a new division in the system.
   *
   * @param data - The division data to create (excluding auto-generated fields)
   * @returns Promise<Division> - The created division with generated ID
   */
  abstract create(
    data: Omit<Division, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Division>;

  /**
   * Retrieves divisions using DevExtreme-compatible query parameters.
   *
   * @param loadOptions - DevExtreme query parameters including filter and sort
   * @returns Promise<DevExtremePaginatedResponseDto<Division>> - Paginated division data
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Division>>;

  /**
   * Retrieves divisions with custom pagination and filtering.
   *
   * @param filterQuery - Search criteria for filtering divisions
   * @param paginationOptions - Pagination settings including page and limit
   * @returns Promise<IPaginatedResult<Division>> - Paginated division results
   */
  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery?: FindAllDivisionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Division>>;

  /**
   * Retrieves a division by its unique identifier.
   *
   * @param id - The unique identifier of the division
   * @returns Promise<NullableType<Division>> - The division or null if not found
   */
  abstract findById(id: Division['id']): Promise<NullableType<Division>>;

  /**
   * Retrieves multiple divisions by their identifiers.
   *
   * @param ids - Array of division identifiers to retrieve
   * @returns Promise<Division[]> - Array of found divisions
   */
  abstract findByIds(ids: Division['id'][]): Promise<Division[]>;

  /**
   * Retrieves a division by its unique code.
   *
   * @param division_code - The unique division code
   * @returns Promise<NullableType<Division>> - The division or null if not found
   */
  abstract findByCode(
    division_code: Division['division_code'],
  ): Promise<NullableType<Division>>;

  /**
   * Retrieves all active divisions in the system.
   *
   * @returns Promise<Pick<Division, 'id' | 'division_code' | 'division_name'>[]> - Array of active divisions
   */
  abstract findAll(): Promise<
    Pick<Division, 'id' | 'division_code' | 'division_name'>[]
  >;

  /**
   * Retrieves distinct division names from the system.
   *
   * @returns Promise<Division[]> - Array of unique division names
   */
  abstract findDistinct(): Promise<Division[]>;

  /**
   * Updates an existing division with new information.
   *
   * @param id - The unique identifier of the division to update
   * @param payload - The updated division data
   * @returns Promise<Division> - The updated division
   */
  abstract update(
    id: Division['id'],
    payload: Partial<Division>,
  ): Promise<Division>;

  /**
   * Soft deletes a division from the system.
   *
   * @param id - The unique identifier of the division to delete
   * @param causer - The user performing the deletion action
   * @returns Promise<void>
   */
  abstract remove(id: Division['id'], causer: User): Promise<void>;

  /**
   * Performs a lookup operation for division selection.
   *
   * @param loadOptions - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for divisions
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   */
  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;
}
