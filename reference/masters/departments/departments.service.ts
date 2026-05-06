import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { CreateDepartmentDto } from '@/masters/departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '@/masters/departments/dto/update-department.dto';
import { BaseDepartmentRepository } from '@/masters/departments/persistence/base-department.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Department } from '@/masters/departments/domain/department';
import { User } from '@/users/domain/user';
import { UsersService } from '@/users/users.service';
import { FindAllDepartmentsDto } from '@/masters/departments/dto/find-all-departments.dto';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';

/**
 * Service for managing departments in the organizational hierarchy.
 *
 * This service provides comprehensive business logic for department operations,
 * including creation, retrieval, updates, status management, and bulk operations.
 * Departments are organizational units that can be assigned department heads
 * and are part of the organizational structure hierarchy.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Create a new department
 * const department = await this.departmentsService.create({
 *   department_code: 'IT',
 *   department_name: 'Information Technology',
 *   department_head: 1,
 *   status: StatusEnum.ACTIVE
 * }, currentUser);
 * ```
 */
@Injectable()
export class DepartmentsService {
  /**
   * Creates an instance of DepartmentsService.
   *
   * @param departmentRepository - Repository for department data operations
   * @param usersService - Service for user entity operations
   */
  constructor(
    private readonly departmentRepository: BaseDepartmentRepository,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Creates a new department in the organizational hierarchy.
   *
   * The department code must be unique across the system. The system validates
   * that the department head exists and generates a new department with the
   * specified organizational structure.
   *
   * @param createDepartmentDto - The department creation data
   * @param causer - The user creating the department
   * @returns Promise<Department> - The created department with generated code
   *
   * @throws {UnprocessableEntityException} When department code already exists
   * @throws {NotFoundException} When department head doesn't exist
   *
   * @example
   * ```typescript
   * const department = await this.create({
   *   department_code: 'IT',
   *   department_name: 'Information Technology',
   *   department_head: 1,
   *   status: StatusEnum.ACTIVE
   * }, currentUser);
   * // Returns: { id: 1, department_code: 'IT', department_name: 'Information Technology', ... }
   * ```
   */
  async create(createDepartmentDto: CreateDepartmentDto, causer: User) {
    // check if code already exist
    const department = await this.departmentRepository.findByCode(
      createDepartmentDto.department_code,
    );

    if (department)
      throw new UnprocessableEntityException('Department code already exist!');

    const department_head = await this.usersService.findById(
      createDepartmentDto.department_head,
    );

    if (!department_head)
      throw new NotFoundException('Department head does not exist!');

    return this.departmentRepository.create({
      department_head,
      department_code: createDepartmentDto.department_code,
      department_name: createDepartmentDto.department_name,
      status: createDepartmentDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  /**
   * Retrieves departments with DevExtreme-compatible filtering and pagination.
   *
   * This method supports advanced filtering, sorting, and pagination
   * compatible with DevExtreme DataGrid components. It provides a flexible
   * query interface for complex data operations.
   *
   * @param queryParams - DevExtreme query parameters for filtering and pagination
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
  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.departmentRepository.findByMany(queryParamsParsed);
  }

  /**
   * Retrieves departments with standard pagination and filtering.
   *
   * This method provides a simplified pagination interface with search
   * capabilities and status filtering. It's designed for standard web
   * applications that don't require DevExtreme-specific features.
   *
   * @param filterQuery - Search term to filter departments by code or name
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
  findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllDepartmentsDto['search'];
    paginationOptions: IPaginationOptions;
  }) {
    return this.departmentRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  /**
   * Retrieves a specific department by its unique identifier.
   *
   * Returns the complete department entity with all related information
   * including department head details. This method provides full details
   * for detailed views and forms.
   *
   * @param id - The unique identifier of the department
   * @returns Promise<Department> - The complete department entity
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const department = await this.findById(1);
   * // Returns: { id: 1, department_code: 'IT', department_name: 'Information Technology', ... }
   * ```
   */
  async findById(id: Department['id']) {
    const department = await this.departmentRepository.findById(id);

    if (!department) throw new NotFoundException('Department does not exist!');

    return department;
  }

  /**
   * Retrieves multiple departments by their IDs.
   *
   * Returns an array of departments matching the provided IDs.
   * This method is useful for bulk operations and batch processing.
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
  findByIds(ids: Department['id'][]) {
    return this.departmentRepository.findByIds(ids);
  }

  /**
   * Retrieves a department by its unique code.
   *
   * Searches for a department using its code (e.g., 'IT').
   * This method is useful when you have the department code but need
   * the full entity information.
   *
   * @param code - The unique department code
   * @returns Promise<Department | null> - The department entity or null if not found
   *
   * @example
   * ```typescript
   * const department = await this.findByCode('IT');
   * // Returns: { id: 1, department_code: 'IT', ... } or null
   * ```
   */
  findByCode(code: Department['department_code']) {
    return this.departmentRepository.findByCode(code);
  }

  /**
   * Retrieves all departments without pagination.
   *
   * Returns a simplified list of all departments with basic information
   * (id, code, name) suitable for dropdowns, lookups, and simple listings.
   * This method is optimized for performance and doesn't include
   * full entity relationships.
   *
   * @returns Promise<FindAllDepartment[]> - Array of simplified department data
   *
   * @example
   * ```typescript
   * const departments = await this.findAll();
   * // Returns: [{ id: 1, department_code: 'IT', department_name: 'Information Technology' }, ...]
   * ```
   */
  findAll() {
    return this.departmentRepository.findAll();
  }

  /**
   * Retrieves all distinct department names.
   *
   * Returns an array of unique department names from the database.
   * This method is useful for validation, reporting, and data analysis.
   *
   * @returns Promise<string[]> - Array of unique department names
   *
   * @example
   * ```typescript
   * const names = await this.findDistinct();
   * // Returns: ['Information Technology', 'Human Resources', 'Finance', ...]
   * ```
   */
  async findDistinct() {
    const departments = await this.departmentRepository.findDistinct();
    return departments.map((department) => department.department_name);
  }

  /**
   * Updates an existing department with new information.
   *
   * Allows partial updates to department properties. If department code
   * changes, the system validates uniqueness. If department head changes,
   * the system validates that the new head exists. All changes are tracked
   * with audit information.
   *
   * @param id - The unique identifier of the department to update
   * @param updateDepartmentDto - The updated department data
   * @param causer - The user performing the update
   * @returns Promise<Department> - The updated department entity
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   * @throws {UnprocessableEntityException} When the new department code already exists
   * @throws {NotFoundException} When new department head doesn't exist
   *
   * @example
   * ```typescript
   * const updatedDepartment = await this.update(1, {
   *   department_name: 'Updated IT Department',
   *   status: StatusEnum.HOLD
   * }, currentUser);
   * ```
   */
  async update(
    id: Department['id'],
    updateDepartmentDto: UpdateDepartmentDto,
    causer: User,
  ): Promise<Department> {
    const department = await this.findById(id);
    const partialDepartment: Partial<Department> = new Department();

    if (!department) throw new NotFoundException('Department does not exist!');

    Object.assign(partialDepartment, updateDepartmentDto);

    // check if code already exist
    if (
      updateDepartmentDto.department_code &&
      updateDepartmentDto.department_code != department.department_code
    ) {
      const departmentCode = await this.departmentRepository.findByCode(
        updateDepartmentDto.department_code,
      );

      if (departmentCode)
        throw new UnprocessableEntityException(
          'Department code already exist!',
        );
    }

    if (updateDepartmentDto.department_head) {
      const department_head = await this.usersService.findById(
        updateDepartmentDto.department_head,
      );

      if (!department_head)
        throw new NotFoundException('Department head does not exist!');

      partialDepartment.department_head = department_head;
    }

    partialDepartment.updated_by = causer;

    return this.departmentRepository.update(id, partialDepartment);
  }

  /**
   * Updates the status of a department.
   *
   * Changes the department status to one of the valid statuses: Active, Hold, or Cancelled.
   * This method validates the status and ensures the department exists before
   * performing the update. It uses the existing update method internally.
   *
   * @param id - The unique identifier of the department
   * @param status - The new status to set (Active, Hold, or Cancelled)
   * @param causer - The user performing the status update
   * @returns Promise<Department> - The updated department with new status
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   * @throws {BadRequestException} When invalid status is provided
   *
   * @example
   * ```typescript
   * const department = await this.updateStatus(1, 'Hold', currentUser);
   * // Returns: { id: 1, status: 'Hold', ... }
   * ```
   */
  async updateStatus(
    id: number,
    status: 'Active' | 'Hold' | 'Cancelled',
    causer: User,
  ): Promise<Department> {
    // Validate status
    const validStatuses = ['Active', 'Hold', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    // Get the department first to ensure it exists
    const department = await this.findById(id);
    if (!department) {
      throw new NotFoundException('Department does not exist!');
    }

    // Update the status using the existing update method
    const updateDto: UpdateDepartmentDto = {
      status: status as StatusEnum,
    };
    return this.update(id, updateDto, causer);
  }

  /**
   * Performs bulk deletion of multiple departments.
   *
   * Deletes up to 100 departments in a single operation. Each deletion
   * is processed individually, and the operation continues even if some
   * deletions fail. Returns a summary of successful and failed deletions
   * with detailed error information.
   *
   * @param ids - Array of department IDs to delete (1-100 items)
   * @param causer - The user performing the bulk deletion
   * @returns Promise with deletion summary including counts and errors
   *
   * @throws {BadRequestException} When no IDs provided or invalid ID format
   *
   * @example
   * ```typescript
   * const result = await this.bulkDelete([1, 2, 3, 4, 5], currentUser);
   * // Returns: { deleted: 4, failed: 1, errors: ['Department 5 not found'] }
   * ```
   */
  async bulkDelete(
    ids: number[],
    causer: User,
  ): Promise<{
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No department IDs provided');
    }

    // Validate that all IDs are valid numbers
    const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid department IDs: ${invalidIds.join(', ')}`,
      );
    }

    let deleted = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each deletion individually
    for (const id of ids) {
      try {
        await this.remove(id, causer);
        deleted++;
      } catch (error) {
        failed++;
        if (error instanceof NotFoundException) {
          errors.push(`Department ${id} not found`);
        } else {
          errors.push(`Failed to delete department ${id}: ${error.message}`);
        }
      }
    }

    return {
      deleted,
      failed,
      errors,
    };
  }

  /**
   * Performs a lookup search for departments with advanced filtering.
   *
   * This method is designed for autocomplete, search suggestions, and
   * lookup operations. It supports complex filtering expressions and
   * exclusion of specific items. The response includes only essential
   * fields (id, code, name) for optimal performance.
   *
   * @param queryParams - Lookup query parameters with filtering options
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
  async lookup(queryParams: LookUpDto, exclude?: BulkExcludeDto) {
    const queryParamsParsed = {
      ...queryParams,
      searchExpr: (queryParams.searchExpr || '').replace(/"/g, ''),
      searchOperation: (queryParams.searchOperation || '').replace(/"/g, ''),
      searchValue: (queryParams.searchValue || '').replace(/"/g, ''),
    };

    if (queryParamsParsed.searchExpr) {
      queryParamsParsed.filter = [
        queryParamsParsed.searchExpr,
        queryParamsParsed.searchOperation,
        queryParamsParsed.searchValue,
      ];
    }
    return await this.departmentRepository.lookup(queryParamsParsed, exclude);
  }

  /**
   * Retrieves a single department by ID for lookup purposes.
   *
   * Returns simplified department information (id, code, name) for
   * a specific department. This is typically used in forms where
   * you need to display department details after selection.
   *
   * @param id - The unique identifier of the department
   * @returns Promise with simplified department data
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const department = await this.lookupById(1);
   * // Returns: { id: 1, department_code: 'IT', department_name: 'Information Technology' }
   * ```
   */
  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      department_code: result?.department_code,
      department_name: result?.department_name,
    };
  }

  /**
   * Soft deletes a department.
   *
   * Performs a soft delete operation on the department, marking it as
   * deleted without removing it from the database. The department
   * will be hidden from normal queries but can be recovered if needed.
   *
   * @param id - The unique identifier of the department to delete
   * @param causer - The user performing the deletion
   * @returns Promise<void>
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * await this.remove(1, currentUser);
   * // Department is soft deleted and marked with deleted_by and deleted_at
   * ```
   */
  async remove(id: Department['id'], causer: User) {
    const department = await this.findById(id);

    if (!department) throw new NotFoundException('Department does not exist!');

    await this.departmentRepository.remove(id, causer);
  }
}
