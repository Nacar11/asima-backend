import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Department } from '@/masters/departments/domain/department';
import { FindAllDepartmentsDto } from '@/masters/departments/dto/find-all-departments.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';

/**
 * Abstract base repository interface for department data operations.
 *
 * This abstract class defines the contract for all department repository implementations.
 * It provides a consistent interface for department data operations including CRUD operations,
 * advanced filtering, pagination, and lookup functionality. Concrete implementations
 * must provide implementations for all abstract methods.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * class DepartmentRepository implements BaseDepartmentRepository {
 *   async create(data: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
 *     // Implementation here
 *   }
 *   // ... other method implementations
 * }
 * ```
 */
export abstract class BaseDepartmentRepository {
  /**
   * Creates a new department in the database.
   *
   * @param data - The department data to create (excluding id, created_at, updated_at)
   * @returns Promise<Department> - The created department entity
   *
   * @example
   * ```typescript
   * const department = await this.create({
   *   department_code: 'IT',
   *   department_name: 'Information Technology',
   *   department_head: userEntity,
   *   status: StatusEnum.ACTIVE,
   *   created_by: causer,
   *   updated_by: causer
   * });
   * ```
   */
  abstract create(
    data: Omit<Department, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Department>;

  /**
   * Retrieves departments with DevExtreme-compatible filtering and pagination.
   *
   * @param loadOptions - DevExtreme query parameters for filtering and pagination
   * @returns Promise<DevExtremePaginatedResponseDto<Department>> - Paginated departments response
   *
   * @example
   * ```typescript
   * const result = await this.findByMany({
   *   filter: ['status', '=', 'Active'],
   *   sort: [{ selector: 'department_code', desc: false }],
   *   skip: 0,
   *   take: 10
   * });
   * ```
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Department>>;

  /**
   * Retrieves departments with standard pagination and filtering.
   *
   * @param filterQuery - Search term to filter departments by code, name, or department head
   * @param paginationOptions - Pagination options including page and limit
   * @returns Promise<IPaginatedResult<Department>> - Paginated departments result
   *
   * @example
   * ```typescript
   * const result = await this.findAllWithPagination({
   *   filterQuery: 'IT',
   *   paginationOptions: {
   *     page: 1,
   *     limit: 20
   *   }
   * });
   * ```
   */
  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery?: FindAllDepartmentsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Department>>;

  /**
   * Retrieves a specific department by its unique identifier.
   *
   * @param id - The unique identifier of the department
   * @returns Promise<NullableType<Department>> - The department entity or null if not found
   *
   * @example
   * ```typescript
   * const department = await this.findById(1);
   * // Returns: { id: 1, department_code: 'IT', ... } or null
   * ```
   */
  abstract findById(id: Department['id']): Promise<NullableType<Department>>;

  /**
   * Retrieves multiple departments by their IDs.
   *
   * @param ids - Array of department IDs to retrieve
   * @returns Promise<Department[]> - Array of department entities
   *
   * @example
   * ```typescript
   * const departments = await this.findByIds([1, 2, 3, 4, 5]);
   * // Returns: [{ id: 1, ... }, { id: 2, ... }, ...]
   * ```
   */
  abstract findByIds(ids: Department['id'][]): Promise<Department[]>;

  /**
   * Retrieves a department by its unique code.
   *
   * @param department_code - The unique department code
   * @returns Promise<NullableType<Department>> - The department entity or null if not found
   *
   * @example
   * ```typescript
   * const department = await this.findByCode('IT');
   * // Returns: { id: 1, department_code: 'IT', ... } or null
   * ```
   */
  abstract findByCode(
    department_code: Department['department_code'],
  ): Promise<NullableType<Department>>;

  /**
   * Retrieves all departments without pagination.
   *
   * @returns Promise<Pick<Department, 'id' | 'department_code' | 'department_name'>[]> - Array of simplified department data
   *
   * @example
   * ```typescript
   * const departments = await this.findAll();
   * // Returns: [{ id: 1, department_code: 'IT', department_name: 'Information Technology' }, ...]
   * ```
   */
  abstract findAll(): Promise<
    Pick<Department, 'id' | 'department_code' | 'department_name'>[]
  >;

  /**
   * Retrieves all distinct department names.
   *
   * @returns Promise<Department[]> - Array of department names
   *
   * @example
   * ```typescript
   * const names = await this.findDistinct();
   * // Returns: [{ department_name: 'Information Technology' }, ...]
   * ```
   */
  abstract findDistinct(): Promise<Department[]>;

  /**
   * Updates an existing department with new information.
   *
   * @param id - The unique identifier of the department to update
   * @param payload - The updated department data
   * @returns Promise<Department> - The updated department entity
   *
   * @example
   * ```typescript
   * const updatedDepartment = await this.update(1, {
   *   department_name: 'Updated IT Department',
   *   status: StatusEnum.HOLD
   * });
   * ```
   */
  abstract update(
    id: Department['id'],
    payload: Partial<Department>,
  ): Promise<Department>;

  /**
   * Soft deletes a department.
   *
   * @param id - The unique identifier of the department to delete
   * @param causer - The user performing the deletion
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await this.remove(1, currentUser);
   * // Department is soft deleted and marked with deleted_by and deleted_at
   * ```
   */
  abstract remove(id: Department['id'], causer: User): Promise<void>;

  /**
   * Performs a lookup search for departments with advanced filtering.
   *
   * @param loadOptions - Lookup query parameters with filtering options
   * @param exclude - Optional exclusion parameters for bulk operations
   * @returns Promise with lookup data and total count
   *
   * @example
   * ```typescript
   * const result = await this.lookup(
   *   { searchExpr: 'department_code', searchOperation: 'contains', searchValue: 'IT' },
   *   { excludeIds: [1, 2, 3] }
   * );
   * // Returns: { data: [{ id: 4, code: 'IT', name: 'Information Technology' }], totalCount: 1 }
   * ```
   */
  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;
}
