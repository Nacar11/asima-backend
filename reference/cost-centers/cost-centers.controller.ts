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
import { LookUpDto } from '@/utils/dto/lookup.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

/**
 * Cost Centers Controller
 *
 * Handles HTTP requests for cost center management operations including:
 * - Creating new cost centers with hierarchical organization structure
 * - Retrieving cost centers with full related entity data (division, department, section, sub-section)
 * - Updating existing cost centers
 * - Soft deleting cost centers
 * - Lookup operations for dropdown/selection purposes
 *
 * All endpoints require JWT authentication and return cost centers with complete
 * organizational hierarchy and user audit information.
 *
 * @example
 * ```typescript
 * // Get a cost center with all related data
 * GET /api/v1/cost-centers/6
 * // Returns: { id, cost_center_code, division, department, section, sub_section, created_by, updated_by, deleted_by, cost_center_name }
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
@ApiTags('CostCenters')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'cost-centers',
  version: '1',
})
export class CostCentersController {
  /**
   * Creates a new instance of CostCentersController
   * @param costCentersService - The cost centers service for business logic operations
   */
  constructor(private readonly costCentersService: CostCentersService) {}

  /**
   * Creates a new cost center
   *
   * Creates a cost center with hierarchical organization structure.
   * The cost center code is automatically generated based on the combination
   * of division, department, section, and sub-section codes.
   *
   * @param createCostCenterDto - The cost center creation data
   * @param currentUser - The authenticated user creating the cost center
   * @returns Promise<CostCenter> - The created cost center with all related entities
   *
   * @example
   * ```typescript
   * POST /api/v1/cost-centers
   * {
   *   "division": "01",
   *   "department": "01",
   *   "section": "01",
   *   "sub_section": "01",
   *   "remarks": "Backend Development Team"
   * }
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

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: FindAllCostCenter,
    isArray: true,
  })
  findAll() {
    return this.costCentersService.findAll();
  }

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
   * Retrieves a cost center by ID with complete related entity data
   *
   * Returns a cost center with all related organizational entities including:
   * - Division information (id, code, name)
   * - Department information (id, code, name)
   * - Section information (id, code, name)
   * - Sub-section information (id, code, name)
   * - User audit information (created_by, updated_by, deleted_by)
   * - Computed cost_center_name field
   *
   * This endpoint was recently fixed to include all related entities that were
   * previously missing from the response.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise<CostCenter> - The cost center with complete related data
   *
   * @example
   * ```typescript
   * GET /api/v1/cost-centers/6
   * // Returns complete cost center with division, department, section, sub_section, and user audit data
   * ```
   *
   * @throws {NotFoundException} When cost center with given ID does not exist
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

  @Patch('/bulk-hold')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Cost Centers successfully hold!',
  })
  ulkHold(@Body() bulkHoldGRDto: BulkActionDto) {
    return this.costCentersService.bulkHold(bulkHoldGRDto.ids);
  }

  @Patch('/bulk-release')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Cost Centers successfully released!',
  })
  bulkRelease(@Body() bulkReleaseDto: BulkActionDto) {
    return this.costCentersService.bulkRelease(bulkReleaseDto.ids);
  }

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

  @Delete('/bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Cost Centers successfully deleted!',
  })
  bulkDelete(@Body() bulkDeleteDto: BulkActionDto) {
    return this.costCentersService.bulkDelete(bulkDeleteDto.ids);
  }

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
