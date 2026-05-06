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
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from '@/masters/divisions/dto/create-division.dto';
import { UpdateDivisionDto } from '@/masters/divisions/dto/update-division.dto';
import { FindAllDivisionsDto } from '@/masters/divisions/dto/find-all-divisions.dto';
import { BulkDeleteDivisionsDto } from '@/masters/divisions/dto/bulk-delete-divisions.dto';
import { Division } from '@/masters/divisions/domain/division';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { PaginatedResponse } from '@/utils/dto/paginated-response.dto';

import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllDivision } from '@/masters/divisions/domain/find-all-division';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

/**
 * Controller for managing divisions in the organizational hierarchy.
 *
 * This controller provides comprehensive CRUD operations for divisions,
 * including creation, retrieval, updates, status management, and bulk operations.
 * Divisions are organizational units that group departments and represent
 * major business functions within the company structure.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const controller = new DivisionsController(divisionsService);
 * const division = await controller.create(createDivisionDto, currentUser);
 * ```
 */
@ApiTags('Divisions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'divisions',
  version: '3',
})
export class DivisionsController {
  /**
   * Creates an instance of DivisionsController.
   *
   * @param divisionsService - Service for division business logic operations
   */
  constructor(private readonly divisionsService: DivisionsService) {}

  /**
   * Creates a new division in the organizational hierarchy.
   *
   * This endpoint creates a new division with the provided information,
   * performing validation to ensure code uniqueness and division head existence.
   * It returns the complete division object upon successful creation.
   *
   * @param createDivisionDto - The division creation data
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Division> - The newly created division
   *
   * @example
   * ```typescript
   * POST /api/v3/divisions
   * {
   *   "division_code": "01",
   *   "division_name": "Engineering",
   *   "division_head": 123
   * }
   * // Returns: { id: 1, division_code: '01', division_name: 'Engineering', ... }
   * ```
   */
  @Post()
  @ApiCreatedResponse({
    type: Division,
  })
  create(
    @Body() createDivisionDto: CreateDivisionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.divisionsService.create(createDivisionDto, currentUser);
  }
  /**
   * Retrieves divisions using DevExtreme-compatible query parameters.
   *
   * This endpoint supports DevExtreme grid operations including filtering,
   * sorting, and pagination. It returns data in a format compatible
   * with DevExtreme components for seamless integration.
   *
   * @param query - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<Division>> - Paginated division data
   *
   * @example
   * ```typescript
   * GET /api/v3/divisions?filter=["division_name","contains","Engineering"]
   * // Returns: { data: [...], totalCount: 10 }
   * ```
   */
  @Get()
  @ApiOkResponse({
    type: DevExtremePaginatedResponse(Division),
  })
  async findByMany(
    @Query() query: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Division>> {
    const result = await this.divisionsService.findByMany(query);
    return result;
  }
  /**
   * Retrieves divisions with custom pagination and filtering.
   *
   * This endpoint provides paginated access to divisions with custom
   * filtering capabilities. It supports search functionality across
   * division fields and returns paginated results with metadata.
   *
   * @param query - Pagination and search query parameters
   * @returns Promise<PaginatedResponseDto<Division>> - Paginated division results
   *
   * @example
   * ```typescript
   * GET /api/v3/divisions/v2?page=1&limit=10&search=Engineering
   * // Returns: { data: [...], meta: { page: 1, limit: 10, total: 25 } }
   * ```
   */
  @Get('v2')
  @ApiOkResponse({
    type: PaginatedResponse(Division),
  })
  async findAllWithPagination(
    @Query() query: FindAllDivisionsDto,
  ): Promise<PaginatedResponseDto<Division>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<Division> =
      await this.divisionsService.findAllWithPagination({
        filterQuery: query.search,
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }
  /**
   * Retrieves all active divisions in the system.
   *
   * This endpoint returns a simplified list of all active divisions
   * containing only essential information. It's optimized for
   * dropdown lists and selection components.
   *
   * @returns Promise<FindAllDivision[]> - Array of active divisions
   *
   * @example
   * ```typescript
   * GET /api/v3/divisions/all
   * // Returns: [{ id: 1, division_code: '01', division_name: 'Engineering' }, ...]
   * ```
   */
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: FindAllDivision,
    isArray: true,
  })
  findAll() {
    return this.divisionsService.findAll();
  }
  /**
   * Performs a lookup operation for division selection.
   *
   * This endpoint provides optimized division lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific divisions from the results.
   *
   * @param query - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for divisions
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   *
   * @example
   * ```typescript
   * GET /api/v3/divisions/lookup?searchExpr=division_name&searchOperation=contains&searchValue=Engineering
   * // Returns: { data: [{ id: 1, code: '01', name: 'Engineering' }], totalCount: 1 }
   * ```
   */
  @Get('/lookup')
  @ApiOkResponse({
    description: 'Returns a list of divisions for lookup purposes',
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
    return await this.divisionsService.lookup(query, exclude);
  }
  /**
   * Retrieves a division for lookup purposes by ID.
   *
   * This endpoint returns a simplified division object containing only
   * essential fields for lookup operations. It's optimized for
   * dropdown and selection components.
   *
   * @param id - The unique identifier of the division
   * @returns Promise<{ id?: number; code?: string; name?: string }> - Simplified division data
   *
   * @example
   * ```typescript
   * GET /api/v3/divisions/lookup/1
   * // Returns: { id: 1, code: '01', name: 'Engineering' }
   * ```
   */
  @Get('lookup/:id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns a single division for lookup purposes',
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
    return this.divisionsService.lookupById(id);
  }
  /**
   * Retrieves a division by its unique identifier.
   *
   * This endpoint finds a division by its ID and returns the complete
   * division information including relationships and audit data.
   *
   * @param id - The unique identifier of the division
   * @returns Promise<Division> - The complete division information
   *
   * @example
   * ```typescript
   * GET /api/v3/divisions/1
   * // Returns: { id: 1, division_code: '01', division_name: 'Engineering', ... }
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
    type: Division,
  })
  findById(@Param('id') id: number) {
    return this.divisionsService.findById(id);
  }
  /**
   * Updates an existing division with new information.
   *
   * This endpoint updates a division's properties while performing validation
   * to ensure code uniqueness and division head existence. It handles partial
   * updates and maintains data integrity through business rule validation.
   *
   * @param id - The unique identifier of the division to update
   * @param updateDivisionDto - The updated division data
   * @param currentUser - The authenticated user performing the update
   * @returns Promise<Division> - The updated division
   *
   * @example
   * ```typescript
   * PATCH /api/v3/divisions/1
   * {
   *   "division_name": "Advanced Engineering",
   *   "division_head": 456
   * }
   * // Returns: { id: 1, division_name: 'Advanced Engineering', ... }
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
    type: Division,
  })
  update(
    @Param('id') id: number,
    @Body() updateDivisionDto: UpdateDivisionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.divisionsService.update(id, updateDivisionDto, currentUser);
  }
  /**
   * Performs bulk deletion of multiple divisions.
   *
   * This endpoint deletes multiple divisions in a single operation, providing
   * detailed results including successful deletions, failures, and error
   * messages. It processes each deletion individually for comprehensive feedback.
   *
   * @param bulkDeleteDto - DTO containing array of division IDs to delete
   * @param currentUser - The authenticated user performing the bulk deletion
   * @returns Promise<{ deleted: number; failed: number; errors: string[] }> - Bulk deletion results
   *
   * @example
   * ```typescript
   * DELETE /api/v3/divisions/bulk-delete
   * {
   *   "ids": [1, 2, 3]
   * }
   * // Returns: { deleted: 2, failed: 1, errors: ['Division 3 not found'] }
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
          description: 'Number of successfully deleted divisions',
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
    @Body() bulkDeleteDto: BulkDeleteDivisionsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.divisionsService.bulkDelete(bulkDeleteDto.ids, currentUser);
  }
  /**
   * Updates a division status to Hold.
   *
   * This endpoint changes the status of a division to 'Hold',
   * temporarily suspending the division's operations while
   * preserving all data and relationships.
   *
   * @param id - The unique identifier of the division
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Division> - The updated division with Hold status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/divisions/1/hold
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
    type: Division,
    description: 'Division status updated to Hold',
  })
  async hold(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.divisionsService.updateStatus(id, 'Hold', currentUser);
  }
  /**
   * Updates a division status to Active.
   *
   * This endpoint changes the status of a division to 'Active',
   * enabling the division's operations and making it available
   * for normal business processes.
   *
   * @param id - The unique identifier of the division
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Division> - The updated division with Active status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/divisions/1/activate
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
    type: Division,
    description: 'Division status updated to Active',
  })
  async activate(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.divisionsService.updateStatus(id, 'Active', currentUser);
  }
  /**
   * Updates a division status to Cancelled.
   *
   * This endpoint changes the status of a division to 'Cancelled',
   * permanently disabling the division's operations while
   * preserving all data for audit purposes.
   *
   * @param id - The unique identifier of the division
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Division> - The updated division with Cancelled status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/divisions/1/cancel
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
    type: Division,
    description: 'Division status updated to Cancelled',
  })
  async cancel(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.divisionsService.updateStatus(id, 'Cancelled', currentUser);
  }
  /**
   * Soft deletes a division from the system.
   *
   * This endpoint performs a soft delete operation, marking the division
   * as deleted while preserving the data for audit purposes. It updates
   * the status to cancelled and records the deletion information.
   *
   * @param id - The unique identifier of the division to delete
   * @param currentUser - The authenticated user performing the deletion
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * DELETE /api/v3/divisions/1
   * // Division is soft deleted and status set to cancelled
   * ```
   */
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.divisionsService.remove(id, currentUser);
  }
}
