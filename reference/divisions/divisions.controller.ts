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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from '@/divisions/dto/create-division.dto';
import { UpdateDivisionDto } from '@/divisions/dto/update-division.dto';
import { FindAllDivisionsDto } from '@/divisions/dto/find-all-divisions.dto';
import { Division } from '@/divisions/domain/division';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { PaginatedResponse } from '@/utils/dto/paginated-response.dto';

import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllDivision } from '@/divisions/domain/find-all-division';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

/**
 * Divisions Controller
 *
 * Handles HTTP requests for division management operations including:
 * - Creating new divisions with division head assignments
 * - Retrieving divisions with pagination and filtering options
 * - Updating existing divisions
 * - Soft deleting divisions (individual and bulk operations)
 * - Status management (Hold, Active, Cancelled)
 * - Lookup operations for dropdown/selection purposes
 *
 * All endpoints require JWT authentication and return divisions with complete
 * organizational information and user audit trails.
 *
 * @example
 * ```typescript
 * // Get a division with all related data
 * GET /api/v1/divisions/1
 * // Returns: { id, division_code, division_name, division_head, status, created_by, updated_by, deleted_by }
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
@ApiTags('Divisions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'divisions',
  version: '1',
})
export class DivisionsController {
  /**
   * Creates a new instance of DivisionsController
   * @param divisionsService - The divisions service for business logic operations
   */
  constructor(private readonly divisionsService: DivisionsService) {}

  /**
   * Creates a new division
   *
   * Creates a division with the specified division code, name, and division head.
   * The division code must be unique and follow the format requirements.
   * The division head must be an existing user in the system.
   *
   * @param createDivisionDto - The division creation data
   * @param currentUser - The authenticated user creating the division
   * @returns Promise<Division> - The created division with all related entities
   *
   * @example
   * ```typescript
   * POST /api/v1/divisions
   * {
   *   "division_code": "01",
   *   "division_name": "Engineering",
   *   "division_head": 1,
   *   "status": "Active"
   * }
   * ```
   *
   * @throws {UnprocessableEntityException} When division code already exists
   * @throws {NotFoundException} When division head does not exist
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
   * Retrieves divisions with DevExtreme pagination
   *
   * Returns a paginated list of divisions using DevExtreme data grid format.
   * Supports filtering, sorting, and advanced search capabilities.
   *
   * @param query - DevExtreme query parameters for pagination and filtering
   * @returns Promise<DevExtremePaginatedResponseDto<Division>> - Paginated divisions
   *
   * @example
   * ```typescript
   * GET /api/v1/divisions?skip=0&take=10&filter=["division_name","contains","Engineering"]
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
   * Retrieves divisions with standard pagination (v2)
   *
   * Returns a paginated list of divisions using standard pagination format.
   * Supports search filtering and basic pagination controls.
   *
   * @param query - Pagination and search parameters
   * @returns Promise<PaginatedResponseDto<Division>> - Paginated divisions
   *
   * @example
   * ```typescript
   * GET /api/v1/divisions/v2?page=1&limit=20&search=Engineering
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
   * Retrieves all divisions
   *
   * Returns a simple list of all divisions without pagination.
   * Useful for dropdown selections and basic listing purposes.
   *
   * @returns Promise<FindAllDivision[]> - Array of all divisions
   *
   * @example
   * ```typescript
   * GET /api/v1/divisions/all
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
   * Retrieves divisions for lookup purposes
   *
   * Returns a simplified list of divisions with id, code, and name fields.
   * Supports search filtering and exclusion of specific IDs.
   * Optimized for dropdown/selection components.
   *
   * @param query - Lookup query parameters with search capabilities
   * @param exclude - Optional exclusion parameters for specific IDs
   * @returns Promise<{data: {id, code, name}[], totalCount: number}> - Lookup data
   *
   * @example
   * ```typescript
   * GET /api/v1/divisions/lookup?searchExpr=division_name&searchOperation=contains&searchValue=Engineering
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
   * Retrieves a single division for lookup purposes
   *
   * Returns a simplified division object with id, code, and name fields.
   * Optimized for single item selection and validation.
   *
   * @param id - The unique identifier of the division
   * @returns Promise<{id?, code?, name?}> - Division lookup data
   *
   * @example
   * ```typescript
   * GET /api/v1/divisions/lookup/1
   * // Returns: { id: 1, code: "01", name: "Engineering" }
   * ```
   *
   * @throws {NotFoundException} When division with given ID does not exist
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
   * Retrieves a division by ID
   *
   * Returns a complete division object with all related entity data including
   * division head information and user audit trails.
   *
   * @param id - The unique identifier of the division
   * @returns Promise<Division> - The division with complete related data
   *
   * @example
   * ```typescript
   * GET /api/v1/divisions/1
   * // Returns complete division with division_head, created_by, updated_by, etc.
   * ```
   *
   * @throws {NotFoundException} When division with given ID does not exist
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

  @Patch('/bulk-hold')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Division successfully put on hold!',
  })
  bulkHold(@Body() bulkHoldGRDto: BulkActionDto) {
    return this.divisionsService.bulkHold(bulkHoldGRDto.ids);
  }

  @Patch('/bulk-release')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Division successfully released!',
  })
  bulkRelease(@Body() bulkReleaseDto: BulkActionDto) {
    return this.divisionsService.bulkRelease(bulkReleaseDto.ids);
  }

  /**
   * Updates a division
   *
   * Updates an existing division with the provided data. Supports partial updates
   * and validates division code uniqueness and division head existence.
   *
   * @param id - The unique identifier of the division to update
   * @param updateDivisionDto - The division update data
   * @param currentUser - The authenticated user performing the update
   * @returns Promise<Division> - The updated division
   *
   * @example
   * ```typescript
   * PATCH /api/v1/divisions/1
   * {
   *   "division_name": "Updated Engineering Division",
   *   "division_head": 2,
   *   "status": "Active"
   * }
   * ```
   *
   * @throws {NotFoundException} When division with given ID does not exist
   * @throws {UnprocessableEntityException} When division code already exists
   * @throws {NotFoundException} When division head does not exist
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

  @Delete('/bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Division successfully deleted!',
  })
  bulkDelete(@Body() bulkDeleteDto: BulkActionDto) {
    return this.divisionsService.bulkDelete(bulkDeleteDto.ids);
  }

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
