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
import { SubSectionsService } from './sub-sections.service';
import { CreateSubSectionDto } from '@/masters/sub-sections/dto/create-sub-section.dto';
import { UpdateSubSectionDto } from '@/masters/sub-sections/dto/update-sub-section.dto';
import { FindAllSubSectionsDto } from '@/masters/sub-sections/dto/find-all-sub-sections.dto';
import { SubSection } from '@/masters/sub-sections/domain/sub-section';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllSubSection } from '@/masters/sub-sections/domain/find-all-sub-section';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { BulkDeleteSubSectionsDto } from '@/masters/sub-sections/dto/bulk-delete-sub-sections.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';

/**
 * Controller for managing sub-sections in the organizational hierarchy.
 *
 * This controller provides comprehensive CRUD operations for sub-sections,
 * including creation, retrieval, updates, status management, and bulk operations.
 * Sub-sections are organizational units that group teams and represent
 * specific functional areas within sections.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const controller = new SubSectionsController(subSectionsService);
 * const subSection = await controller.create(createSubSectionDto, currentUser);
 * ```
 */
@ApiTags('SubSections')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'sub-sections',
  version: '3',
})
export class SubSectionsController {
  /**
   * Creates an instance of SubSectionsController.
   *
   * @param subSectionsService - Service for sub-section business logic operations
   */
  constructor(private readonly subSectionsService: SubSectionsService) {}

  /**
   * Creates a new sub-section in the organizational hierarchy.
   *
   * This endpoint creates a new sub-section with the provided information,
   * performing validation to ensure code uniqueness and sub-section head existence.
   * It returns the complete sub-section object upon successful creation.
   *
   * @param createSubSectionDto - The sub-section creation data
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<SubSection> - The newly created sub-section
   *
   * @example
   * ```typescript
   * POST /api/v3/sub-sections
   * {
   *   "sub_section_code": "01",
   *   "sub_section_name": "Backend",
   *   "sub_section_head": 123
   * }
   * // Returns: { id: 1, sub_section_code: '01', sub_section_name: 'Backend', ... }
   * ```
   */
  @Post()
  @ApiCreatedResponse({
    type: SubSection,
  })
  create(
    @Body() createSubSectionDto: CreateSubSectionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.subSectionsService.create(createSubSectionDto, currentUser);
  }

  /**
   * Retrieves sub-sections using DevExtreme-compatible query parameters.
   *
   * This endpoint supports DevExtreme grid operations including filtering,
   * sorting, and pagination. It returns data in a format compatible
   * with DevExtreme components for seamless integration.
   *
   * @param query - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<SubSection>> - Paginated sub-section data
   *
   * @example
   * ```typescript
   * GET /api/v3/sub-sections?filter=["sub_section_name","contains","Backend"]
   * // Returns: { data: [...], totalCount: 10 }
   * ```
   */
  @Get()
  @ApiOkResponse({
    type: DevExtremePaginatedResponse(SubSection),
  })
  async findByMany(
    @Query() query: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SubSection>> {
    return await this.subSectionsService.findByMany(query);
  }

  /**
   * Retrieves sub-sections with custom pagination and filtering.
   *
   * This endpoint provides paginated access to sub-sections with custom
   * filtering capabilities. It supports search functionality across
   * sub-section fields and returns paginated results with metadata.
   *
   * @param query - Pagination and search query parameters
   * @returns Promise<PaginatedResponseDto<SubSection>> - Paginated sub-section results
   *
   * @example
   * ```typescript
   * GET /api/v3/sub-sections/v2?page=1&limit=10&search=Backend
   * // Returns: { data: [...], meta: { page: 1, limit: 10, total: 25 } }
   * ```
   */
  @Get('v2')
  @ApiOkResponse({
    type: PaginatedResponse(SubSection),
  })
  async findAllWithPagination(
    @Query() query: FindAllSubSectionsDto,
  ): Promise<PaginatedResponseDto<SubSection>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<SubSection> =
      await this.subSectionsService.findAllWithPagination({
        filterQuery: query.search,
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  /**
   * Retrieves all active sub-sections in the system.
   *
   * This endpoint returns a simplified list of all active sub-sections
   * containing only essential information. It's optimized for
   * dropdown lists and selection components.
   *
   * @returns Promise<FindAllSubSection[]> - Array of active sub-sections
   *
   * @example
   * ```typescript
   * GET /api/v3/sub-sections/all
   * // Returns: [{ id: 1, sub_section_code: '01', sub_section_name: 'Backend' }, ...]
   * ```
   */
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: FindAllSubSection,
    isArray: true,
  })
  findAll() {
    return this.subSectionsService.findAll();
  }

  /**
   * Performs a lookup operation for sub-section selection.
   *
   * This endpoint provides optimized sub-section lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific sub-sections from the results.
   *
   * @param query - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for sub-sections
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   *
   * @example
   * ```typescript
   * GET /api/v3/sub-sections/lookup?searchExpr=sub_section_name&searchOperation=contains&searchValue=Backend
   * // Returns: { data: [{ id: 1, code: '01', name: 'Backend' }], totalCount: 1 }
   * ```
   */
  @Get('/lookup')
  @ApiOkResponse({
    description: 'Returns a list of sub-section for lookup purposes',
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
    return await this.subSectionsService.lookup(query, exclude);
  }

  /**
   * Retrieves a sub-section for lookup purposes by ID.
   *
   * This endpoint returns a simplified sub-section object containing only
   * essential fields for lookup operations. It's optimized for
   * dropdown and selection components.
   *
   * @param id - The unique identifier of the sub-section
   * @returns Promise<{ id?: number; code?: string; name?: string }> - Simplified sub-section data
   *
   * @example
   * ```typescript
   * GET /api/v3/sub-sections/lookup/1
   * // Returns: { id: 1, code: '01', name: 'Backend' }
   * ```
   */
  @Get('lookup/:id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns a single sub-section for lookup purposes',
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
    return this.subSectionsService.lookupById(id);
  }

  /**
   * Retrieves a sub-section by its unique identifier.
   *
   * This endpoint finds a sub-section by its ID and returns the complete
   * sub-section information including relationships and audit data.
   *
   * @param id - The unique identifier of the sub-section
   * @returns Promise<SubSection> - The complete sub-section information
   *
   * @example
   * ```typescript
   * GET /api/v3/sub-sections/1
   * // Returns: { id: 1, sub_section_code: '01', sub_section_name: 'Backend', ... }
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
    type: SubSection,
  })
  findById(@Param('id') id: number) {
    return this.subSectionsService.findById(id);
  }

  /**
   * Updates an existing sub-section with new information.
   *
   * This endpoint updates a sub-section's properties while performing validation
   * to ensure code uniqueness and sub-section head existence. It handles partial
   * updates and maintains data integrity through business rule validation.
   *
   * @param id - The unique identifier of the sub-section to update
   * @param updateSubSectionDto - The updated sub-section data
   * @param currentUser - The authenticated user performing the update
   * @returns Promise<SubSection> - The updated sub-section
   *
   * @example
   * ```typescript
   * PATCH /api/v3/sub-sections/1
   * {
   *   "sub_section_name": "Advanced Backend",
   *   "sub_section_head": 456
   * }
   * // Returns: { id: 1, sub_section_name: 'Advanced Backend', ... }
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
    type: SubSection,
  })
  update(
    @Param('id') id: number,
    @Body() updateSubSectionDto: UpdateSubSectionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.subSectionsService.update(id, updateSubSectionDto, currentUser);
  }

  /**
   * Performs bulk deletion of multiple sub-sections.
   *
   * This endpoint deletes multiple sub-sections in a single operation, providing
   * detailed results including successful deletions, failures, and error
   * messages. It processes each deletion individually for comprehensive feedback.
   *
   * @param bulkDeleteDto - DTO containing array of sub-section IDs to delete
   * @param currentUser - The authenticated user performing the bulk deletion
   * @returns Promise<{ deleted: number; failed: number; errors: string[] }> - Bulk deletion results
   *
   * @example
   * ```typescript
   * DELETE /api/v3/sub-sections/bulk-delete
   * {
   *   "ids": [1, 2, 3]
   * }
   * // Returns: { deleted: 2, failed: 1, errors: ['Sub-section 3 not found'] }
   * ```
   */
  @Delete('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Bulk delete sub-sections',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteSubSectionsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.subSectionsService.bulkDelete(bulkDeleteDto, currentUser);
  }

  /**
   * Updates a sub-section status to Hold.
   *
   * This endpoint changes the status of a sub-section to 'Hold',
   * temporarily suspending the sub-section's operations while
   * preserving all data and relationships.
   *
   * @param id - The unique identifier of the sub-section
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<SubSection> - The updated sub-section with Hold status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/sub-sections/1/hold
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
    type: SubSection,
    description: 'Sub-section status changed to Hold',
  })
  hold(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.subSectionsService.updateStatus(id, 'Hold' as any, currentUser);
  }

  /**
   * Updates a sub-section status to Active.
   *
   * This endpoint changes the status of a sub-section to 'Active',
   * enabling the sub-section's operations and making it available
   * for normal business processes.
   *
   * @param id - The unique identifier of the sub-section
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<SubSection> - The updated sub-section with Active status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/sub-sections/1/activate
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
    type: SubSection,
    description: 'Sub-section status changed to Active',
  })
  activate(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.subSectionsService.updateStatus(
      id,
      'Active' as any,
      currentUser,
    );
  }

  /**
   * Updates a sub-section status to Cancelled.
   *
   * This endpoint changes the status of a sub-section to 'Cancelled',
   * permanently disabling the sub-section's operations while
   * preserving all data for audit purposes.
   *
   * @param id - The unique identifier of the sub-section
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<SubSection> - The updated sub-section with Cancelled status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/sub-sections/1/cancel
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
    type: SubSection,
    description: 'Sub-section status changed to Cancelled',
  })
  cancel(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.subSectionsService.updateStatus(
      id,
      'Cancelled' as any,
      currentUser,
    );
  }

  /**
   * Soft deletes a sub-section from the system.
   *
   * This endpoint performs a soft delete operation, marking the sub-section
   * as deleted while preserving the data for audit purposes. It updates
   * the status to cancelled and records the deletion information.
   *
   * @param id - The unique identifier of the sub-section to delete
   * @param currentUser - The authenticated user performing the deletion
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * DELETE /api/v3/sub-sections/1
   * // Sub-section is soft deleted and status set to cancelled
   * ```
   */
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.subSectionsService.remove(id, currentUser);
  }
}
