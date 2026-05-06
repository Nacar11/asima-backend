import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from '@/masters/departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '@/masters/departments/dto/update-department.dto';
import { FindAllDepartmentsDto } from '@/masters/departments/dto/find-all-departments.dto';
import { BulkDeleteDepartmentsDto } from '@/masters/departments/dto/bulk-delete-departments.dto';
import { Department } from '@/masters/departments/domain/department';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllDepartment } from '@/masters/departments/domain/find-all-department';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';

/**
 * Controller for managing departments in the organizational hierarchy.
 *
 * This controller provides comprehensive CRUD operations for departments,
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
@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'departments',
  version: '3',
})
export class DepartmentsController {
  /**
   * Creates an instance of DepartmentsController.
   *
   * @param departmentsService - The departments service for business logic operations
   */
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Creates a new department in the organizational hierarchy.
   *
   * The department code must be unique across the system. The system validates
   * that the department head exists and generates a new department with the
   * specified organizational structure.
   *
   * @param createDepartmentDto - The department creation data
   * @param currentUser - The authenticated user creating the department
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
  @Post()
  @ApiCreatedResponse({
    type: Department,
  })
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.departmentsService.create(createDepartmentDto, currentUser);
  }

  /**
   * Retrieves departments with DevExtreme-compatible filtering and pagination.
   *
   * This endpoint supports advanced filtering, sorting, and pagination
   * compatible with DevExtreme DataGrid components. It provides a flexible
   * query interface for complex data operations.
   *
   * @param query - DevExtreme query parameters for filtering and pagination
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
  @Get()
  @ApiOkResponse({
    type: DevExtremePaginatedResponse<Department>(Department),
  })
  async findByMany(
    @Query() query: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Department>> {
    const result = await this.departmentsService.findByMany(query);
    return result;
  }

  /**
   * Retrieves departments with standard pagination and filtering.
   *
   * This endpoint provides a simplified pagination interface with search
   * capabilities and status filtering. It's designed for standard web
   * applications that don't require DevExtreme-specific features.
   *
   * @param query - Standard pagination and filtering parameters
   * @returns Promise<PaginatedResponseDto<Department>> - Paginated departments response
   *
   * @example
   * ```typescript
   * const result = await this.findAllWithPagination({
   *   search: 'IT',
   *   page: 1,
   *   limit: 20
   * });
   * ```
   */
  @Get('v2')
  @ApiOkResponse({
    type: PaginatedResponse(Department),
  })
  async findAllWithPagination(
    @Query() query: FindAllDepartmentsDto,
  ): Promise<PaginatedResponseDto<Department>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<Department> =
      await this.departmentsService.findAllWithPagination({
        filterQuery: query.search,
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  /**
   * Retrieves all departments without pagination.
   *
   * Returns a simplified list of all departments with basic information
   * (id, code, name) suitable for dropdowns, lookups, and simple listings.
   * This endpoint is optimized for performance and doesn't include
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
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: FindAllDepartment,
    isArray: true,
  })
  findAll() {
    return this.departmentsService.findAll();
  }

  /**
   * Performs a lookup search for departments with advanced filtering.
   *
   * This endpoint is designed for autocomplete, search suggestions, and
   * lookup operations. It supports complex filtering expressions and
   * exclusion of specific items. The response includes only essential
   * fields (id, code, name) for optimal performance.
   *
   * @param query - Lookup query parameters with filtering options
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
  @Get('/lookup')
  @ApiOkResponse({
    description: 'Returns a list of departments for lookup purposes',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              code: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  async lookup(
    @Query() query: LookUpDto,
    @Query() exclude: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }> {
    return await this.departmentsService.lookup(query, exclude);
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
   * // Returns: { id: 1, code: 'IT', name: 'Information Technology' }
   * ```
   */
  @Get('lookup/:id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns a single department for lookup purposes',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        code: { type: 'string' },
        name: { type: 'string' },
      },
    },
  })
  lookupById(@Param('id') id: number): Promise<{
    id?: number;
    code?: string;
    name?: string;
  }> {
    return this.departmentsService.lookupById(id);
  }

  /**
   * Retrieves a specific department by its unique identifier.
   *
   * Returns the complete department entity with all related information
   * including department head details. This endpoint provides full details
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
  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Department,
  })
  findById(@Param('id') id: number) {
    return this.departmentsService.findById(id);
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
   * @param currentUser - The authenticated user performing the update
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
  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Department,
  })
  update(
    @Param('id') id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto, currentUser);
  }

  /**
   * Performs bulk deletion of multiple departments.
   *
   * Deletes up to 100 departments in a single operation. Each deletion
   * is processed individually, and the operation continues even if some
   * deletions fail. Returns a summary of successful and failed deletions
   * with detailed error information.
   *
   * @param bulkDeleteDto - Contains array of department IDs to delete (1-100 items)
   * @param currentUser - The authenticated user performing the bulk deletion
   * @returns Promise with deletion summary including counts and errors
   *
   * @throws {BadRequestException} When no IDs provided or invalid ID format
   *
   * @example
   * ```typescript
   * const result = await this.bulkDelete(
   *   { ids: [1, 2, 3, 4, 5] },
   *   currentUser
   * );
   * // Returns: { deleted: 4, failed: 1, errors: ['Department 5 not found'] }
   * ```
   */
  @Delete('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Bulk delete operation completed',
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Number of successfully deleted departments',
        },
        failed: { type: 'number', description: 'Number of failed deletions' },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of error messages for failed deletions',
        },
      },
    },
  })
  async bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteDepartmentsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.departmentsService.bulkDelete(bulkDeleteDto.ids, currentUser);
  }

  /**
   * Places a department on hold status.
   *
   * Changes the department status to 'Hold', which typically means
   * the department is temporarily inactive but not cancelled.
   * This is useful for temporary suspensions or maintenance periods.
   *
   * @param id - The unique identifier of the department
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Department> - The updated department with Hold status
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   * @throws {BadRequestException} When invalid status is provided
   *
   * @example
   * ```typescript
   * const department = await this.hold(1, currentUser);
   * // Returns: { id: 1, status: 'Hold', ... }
   * ```
   */
  @Patch(':id/hold')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Department,
    description: 'Department status updated to Hold',
  })
  async hold(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.departmentsService.updateStatus(id, 'Hold', currentUser);
  }

  /**
   * Activates a department.
   *
   * Changes the department status to 'Active', making it available
   * for use in transactions and other business operations.
   * This is the normal operational status for departments.
   *
   * @param id - The unique identifier of the department
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Department> - The updated department with Active status
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   * @throws {BadRequestException} When invalid status is provided
   *
   * @example
   * ```typescript
   * const department = await this.activate(1, currentUser);
   * // Returns: { id: 1, status: 'Active', ... }
   * ```
   */
  @Patch(':id/activate')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Department,
    description: 'Department status updated to Active',
  })
  async activate(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.departmentsService.updateStatus(id, 'Active', currentUser);
  }

  /**
   * Cancels a department.
   *
   * Changes the department status to 'Cancelled', which typically means
   * the department is permanently inactive and should not be used
   * for new transactions. This is a final status change.
   *
   * @param id - The unique identifier of the department
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Department> - The updated department with Cancelled status
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   * @throws {BadRequestException} When invalid status is provided
   *
   * @example
   * ```typescript
   * const department = await this.cancel(1, currentUser);
   * // Returns: { id: 1, status: 'Cancelled', ... }
   * ```
   */
  @Patch(':id/cancel')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Department,
    description: 'Department status updated to Cancelled',
  })
  async cancel(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.departmentsService.updateStatus(id, 'Cancelled', currentUser);
  }

  /**
   * Soft deletes a department.
   *
   * Performs a soft delete operation on the department, marking it as
   * deleted without removing it from the database. The department
   * will be hidden from normal queries but can be recovered if needed.
   *
   * @param id - The unique identifier of the department to delete
   * @param currentUser - The authenticated user performing the deletion
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
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.departmentsService.remove(id, currentUser);
  }
}
