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
import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto } from '@/masters/cost-centers/dto/create-cost-center.dto';
import { UpdateCostCenterDto } from '@/masters/cost-centers/dto/update-cost-center.dto';
import { FindAllCostCentersDto } from '@/masters/cost-centers/dto/find-all-cost-centers.dto';
import { CostCenter } from '@/masters/cost-centers/domain/cost-center';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllCostCenter } from '@/masters/cost-centers/domain/find-all-cost-center';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { BulkDeleteCostCentersDto } from '@/masters/cost-centers/dto/bulk-delete-cost-centers.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';

/**
 * Controller for managing cost centers in the organizational hierarchy.
 *
 * This controller provides comprehensive CRUD operations for cost centers,
 * including creation, retrieval, updates, status management, and bulk operations.
 * Cost centers are automatically generated based on the organizational structure
 * (division, department, section, sub-section) and follow a hierarchical code system.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Create a new cost center
 * const costCenter = await this.costCentersService.create({
 *   division: '01',
 *   department: '01',
 *   section: '01',
 *   sub_section: '01',
 *   remarks: 'Backend Development Team'
 * }, currentUser);
 * ```
 */
@ApiTags('CostCenters')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'cost-centers',
  version: '3',
})
export class CostCentersController {
  /**
   * Creates an instance of CostCentersController.
   *
   * @param costCentersService - The cost centers service for business logic operations
   */
  constructor(private readonly costCentersService: CostCentersService) {}

  /**
   * Creates a new cost center in the organizational hierarchy.
   *
   * The cost center code is automatically generated based on the provided
   * organizational structure (division, department, section, sub-section).
   * The system validates that all referenced entities exist and generates
   * a unique cost center code following the pattern: division + department + section + sub_section.
   *
   * @param createCostCenterDto - The cost center creation data
   * @param currentUser - The authenticated user creating the cost center
   * @returns Promise<CostCenter> - The created cost center with generated code
   *
   * @throws {NotFoundException} When referenced division, department, section, or sub-section doesn't exist
   * @throws {UnprocessableEntityException} When the generated cost center code already exists
   *
   * @example
   * ```typescript
   * const costCenter = await this.create({
   *   division: '01',
   *   department: '01',
   *   section: '01',
   *   sub_section: '01',
   *   remarks: 'Backend Development Team',
   *   status: StatusEnum.ACTIVE
   * }, currentUser);
   * // Returns: { id: 1, cost_center_code: '01010101', ... }
   * ```
   */
  @Post()
  @ApiCreatedResponse({
    type: CostCenter,
  })
  create(
    @Body() createCostCenterDto: CreateCostCenterDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.costCentersService.create(createCostCenterDto, currentUser);
  }

  /**
   * Retrieves cost centers with DevExtreme-compatible filtering and pagination.
   *
   * This endpoint supports advanced filtering, sorting, and pagination
   * compatible with DevExtreme DataGrid components. It provides a flexible
   * query interface for complex data operations.
   *
   * @param query - DevExtreme query parameters for filtering and pagination
   * @returns Promise<DevExtremePaginatedResponseDto<CostCenter>> - Paginated cost centers response
   *
   * @example
   * ```typescript
   * const result = await this.findByMany({
   *   filter: ['status', '=', 'Active'],
   *   sort: [{ selector: 'cost_center_code', desc: false }],
   *   skip: 0,
   *   take: 10
   * });
   * ```
   */
  @Get()
  @ApiOkResponse({
    type: DevExtremePaginatedResponse(CostCenter),
  })
  async findByMany(
    @Query() query: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<CostCenter>> {
    const result = await this.costCentersService.findByMany(query);
    return result;
  }

  /**
   * Retrieves cost centers with standard pagination and filtering.
   *
   * This endpoint provides a simplified pagination interface with search
   * capabilities and status filtering. It's designed for standard web
   * applications that don't require DevExtreme-specific features.
   *
   * @param query - Standard pagination and filtering parameters
   * @returns Promise<PaginatedResponseDto<CostCenter>> - Paginated cost centers response
   *
   * @example
   * ```typescript
   * const result = await this.findAllWithPagination({
   *   search: 'Backend',
   *   page: 1,
   *   limit: 20,
   *   status: [StatusEnum.ACTIVE]
   * });
   * ```
   */
  @Get('v2')
  @ApiOkResponse({
    type: PaginatedResponse(CostCenter),
  })
  async findAllWithPagination(
    @Query() query: FindAllCostCentersDto,
  ): Promise<PaginatedResponseDto<CostCenter>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    const status = query.status ?? 'all';
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<CostCenter> =
      await this.costCentersService.findAllWithPagination({
        filterQuery: query.search,
        paginationOptions: { page, limit, status },
      });

    return paginate(results, { page, limit });
  }

  /**
   * Retrieves all cost centers without pagination.
   *
   * Returns a simplified list of all cost centers with basic information
   * (id, code, name) suitable for dropdowns, lookups, and simple listings.
   * This endpoint is optimized for performance and doesn't include
   * full entity relationships.
   *
   * @returns Promise<FindAllCostCenter[]> - Array of simplified cost center data
   *
   * @example
   * ```typescript
   * const costCenters = await this.findAll();
   * // Returns: [{ id: 1, cost_center_code: '01010101', cost_center_name: '01010101 / Backend' }, ...]
   * ```
   */
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: FindAllCostCenter,
    isArray: true,
  })
  findAll() {
    return this.costCentersService.findAll();
  }

  /**
   * Performs a lookup search for cost centers with advanced filtering.
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
   *   { searchExpr: 'cost_center_code', searchOperation: 'contains', searchValue: '01' },
   *   { excludeIds: [1, 2, 3] }
   * );
   * // Returns: { data: [{ id: 4, code: '01010101', name: '01010101 / Backend' }], totalCount: 1 }
   * ```
   */
  @Get('/lookup')
  @ApiOkResponse({
    description: 'Returns a list of cost centers for lookup purposes',
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
    return await this.costCentersService.lookup(query, exclude);
  }

  /**
   * Retrieves a single cost center by ID for lookup purposes.
   *
   * Returns simplified cost center information (id, code, name) for
   * a specific cost center. This is typically used in forms where
   * you need to display cost center details after selection.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise with simplified cost center data
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const costCenter = await this.lookupById(1);
   * // Returns: { id: 1, code: '01010101', name: '01010101 / Backend' }
   * ```
   */
  @Get('lookup/:id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns a single cost center for lookup purposes',
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
    return this.costCentersService.lookupById(id);
  }

  /**
   * Retrieves a specific cost center by its unique identifier.
   *
   * Returns the complete cost center entity with all related organizational
   * structure information (division, department, section, sub-section).
   * This endpoint provides full details for detailed views and forms.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise<CostCenter> - The complete cost center entity
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const costCenter = await this.findById(1);
   * // Returns: { id: 1, cost_center_code: '01010101', division: {...}, department: {...}, ... }
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
    type: CostCenter,
  })
  findById(@Param('id') id: number) {
    return this.costCentersService.findById(id);
  }

  /**
   * Updates an existing cost center with new information.
   *
   * Allows partial updates to cost center properties. If organizational
   * structure changes, the cost center code will be automatically
   * regenerated and validated for uniqueness. All changes are tracked
   * with audit information.
   *
   * @param id - The unique identifier of the cost center to update
   * @param updateCostCenterDto - The updated cost center data
   * @param currentUser - The authenticated user performing the update
   * @returns Promise<CostCenter> - The updated cost center entity
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   * @throws {UnprocessableEntityException} When the new cost center code already exists
   *
   * @example
   * ```typescript
   * const updatedCostCenter = await this.update(1, {
   *   remarks: 'Updated description',
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
    type: CostCenter,
  })
  update(
    @Param('id') id: number,
    @Body() updateCostCenterDto: UpdateCostCenterDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.costCentersService.update(id, updateCostCenterDto, currentUser);
  }

  /**
   * Performs bulk deletion of multiple cost centers.
   *
   * Deletes up to 100 cost centers in a single operation. Each deletion
   * is processed individually, and the operation continues even if some
   * deletions fail. Returns a summary of successful and failed deletions
   * with detailed error information.
   *
   * @param bulkDeleteDto - Contains array of cost center IDs to delete (1-100 items)
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
   * // Returns: { deleted: 4, failed: 1, errors: ['Cost center 5 not found'] }
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
          description: 'Number of successfully deleted cost centers',
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
    @Body() bulkDeleteDto: BulkDeleteCostCentersDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.costCentersService.bulkDelete(bulkDeleteDto.ids, currentUser);
  }

  /**
   * Places a cost center on hold status.
   *
   * Changes the cost center status to 'Hold', which typically means
   * the cost center is temporarily inactive but not cancelled.
   * This is useful for temporary suspensions or maintenance periods.
   *
   * @param id - The unique identifier of the cost center
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<CostCenter> - The updated cost center with Hold status
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   * @throws {BadRequestException} When invalid status is provided
   *
   * @example
   * ```typescript
   * const costCenter = await this.hold(1, currentUser);
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
    type: CostCenter,
    description: 'Cost center status updated to Hold',
  })
  async hold(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.costCentersService.updateStatus(id, 'Hold', currentUser);
  }

  /**
   * Activates a cost center.
   *
   * Changes the cost center status to 'Active', making it available
   * for use in transactions and other business operations.
   * This is the normal operational status for cost centers.
   *
   * @param id - The unique identifier of the cost center
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<CostCenter> - The updated cost center with Active status
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   * @throws {BadRequestException} When invalid status is provided
   *
   * @example
   * ```typescript
   * const costCenter = await this.activate(1, currentUser);
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
    type: CostCenter,
    description: 'Cost center status updated to Active',
  })
  async activate(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.costCentersService.updateStatus(id, 'Active', currentUser);
  }

  /**
   * Cancels a cost center.
   *
   * Changes the cost center status to 'Cancelled', which typically means
   * the cost center is permanently inactive and should not be used
   * for new transactions. This is a final status change.
   *
   * @param id - The unique identifier of the cost center
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<CostCenter> - The updated cost center with Cancelled status
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   * @throws {BadRequestException} When invalid status is provided
   *
   * @example
   * ```typescript
   * const costCenter = await this.cancel(1, currentUser);
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
    type: CostCenter,
    description: 'Cost center status updated to Cancelled',
  })
  async cancel(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.costCentersService.updateStatus(id, 'Cancelled', currentUser);
  }

  /**
   * Soft deletes a cost center.
   *
   * Performs a soft delete operation on the cost center, marking it as
   * deleted without removing it from the database. The cost center
   * will be hidden from normal queries but can be recovered if needed.
   *
   * @param id - The unique identifier of the cost center to delete
   * @param currentUser - The authenticated user performing the deletion
   * @returns Promise<void>
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * await this.remove(1, currentUser);
   * // Cost center is soft deleted and marked with deleted_by and deleted_at
   * ```
   */
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.costCentersService.remove(id, currentUser);
  }
}
