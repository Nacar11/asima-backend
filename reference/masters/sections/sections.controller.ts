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
import { SectionsService } from './sections.service';
import { CreateSectionDto } from '@/masters/sections/dto/create-section.dto';
import { UpdateSectionDto } from '@/masters/sections/dto/update-section.dto';
import { FindAllSectionsDto } from '@/masters/sections/dto/find-all-sections.dto';
import { Section } from '@/masters/sections/domain/section';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllSection } from '@/masters/sections/domain/find-all-section';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { BulkDeleteSectionsDto } from '@/masters/sections/dto/bulk-delete-sections.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';

/**
 * Controller for managing sections in the organizational hierarchy.
 *
 * This controller provides comprehensive CRUD operations for sections,
 * including creation, retrieval, updates, status management, and bulk operations.
 * Sections are organizational units that group departments and represent
 * specific functional areas within divisions.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const controller = new SectionsController(sectionsService);
 * const section = await controller.create(createSectionDto, currentUser);
 * ```
 */
@ApiTags('Sections')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'sections',
  version: '3',
})
export class SectionsController {
  /**
   * Creates an instance of SectionsController.
   *
   * @param sectionsService - Service for section business logic operations
   */
  constructor(private readonly sectionsService: SectionsService) {}

  /**
   * Creates a new section in the organizational hierarchy.
   *
   * This endpoint creates a new section with the provided information,
   * performing validation to ensure code uniqueness and section head existence.
   * It returns the complete section object upon successful creation.
   *
   * @param createSectionDto - The section creation data
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Section> - The newly created section
   *
   * @example
   * ```typescript
   * POST /api/v3/sections
   * {
   *   "section_code": "01",
   *   "section_name": "Engineering",
   *   "section_head": 123
   * }
   * // Returns: { id: 1, section_code: '01', section_name: 'Engineering', ... }
   * ```
   */
  @Post()
  @ApiCreatedResponse({
    type: Section,
  })
  create(
    @Body() createSectionDto: CreateSectionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.sectionsService.create(createSectionDto, currentUser);
  }

  /**
   * Retrieves sections using DevExtreme-compatible query parameters.
   *
   * This endpoint supports DevExtreme grid operations including filtering,
   * sorting, and pagination. It returns data in a format compatible
   * with DevExtreme components for seamless integration.
   *
   * @param query - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<Section>> - Paginated section data
   *
   * @example
   * ```typescript
   * GET /api/v3/sections?filter=["section_name","contains","Engineering"]
   * // Returns: { data: [...], totalCount: 10 }
   * ```
   */
  @Get()
  @ApiOkResponse({
    type: DevExtremePaginatedResponse(Section),
  })
  async findByMany(
    @Query() query: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Section>> {
    const result = await this.sectionsService.findByMany(query);
    return result;
  }

  /**
   * Retrieves sections with custom pagination and filtering.
   *
   * This endpoint provides paginated access to sections with custom
   * filtering capabilities. It supports search functionality across
   * section fields and returns paginated results with metadata.
   *
   * @param query - Pagination and search query parameters
   * @returns Promise<PaginatedResponseDto<Section>> - Paginated section results
   *
   * @example
   * ```typescript
   * GET /api/v3/sections/v2?page=1&limit=10&search=Engineering
   * // Returns: { data: [...], meta: { page: 1, limit: 10, total: 25 } }
   * ```
   */
  @Get('v2')
  @ApiOkResponse({
    type: PaginatedResponse(Section),
  })
  async findAllWithPagination(
    @Query() query: FindAllSectionsDto,
  ): Promise<PaginatedResponseDto<Section>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<Section> =
      await this.sectionsService.findAllWithPagination({
        filterQuery: query.search,
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  /**
   * Retrieves all active sections in the system.
   *
   * This endpoint returns a simplified list of all active sections
   * containing only essential information. It's optimized for
   * dropdown lists and selection components.
   *
   * @returns Promise<FindAllSection[]> - Array of active sections
   *
   * @example
   * ```typescript
   * GET /api/v3/sections/all
   * // Returns: [{ id: 1, section_code: '01', section_name: 'Engineering' }, ...]
   * ```
   */
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: FindAllSection,
    isArray: true,
  })
  findAll() {
    return this.sectionsService.findAll();
  }

  /**
   * Performs a lookup operation for section selection.
   *
   * This endpoint provides optimized section lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific sections from the results.
   *
   * @param query - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for sections
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   *
   * @example
   * ```typescript
   * GET /api/v3/sections/lookup?searchExpr=section_name&searchOperation=contains&searchValue=Engineering
   * // Returns: { data: [{ id: 1, code: '01', name: 'Engineering' }], totalCount: 1 }
   * ```
   */
  @Get('/lookup')
  @ApiOkResponse({
    description: 'Returns a list of sections for lookup purposes',
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
    return await this.sectionsService.lookup(query, exclude);
  }

  /**
   * Retrieves a section for lookup purposes by ID.
   *
   * This endpoint returns a simplified section object containing only
   * essential fields for lookup operations. It's optimized for
   * dropdown and selection components.
   *
   * @param id - The unique identifier of the section
   * @returns Promise<{ id?: number; code?: string; name?: string }> - Simplified section data
   *
   * @example
   * ```typescript
   * GET /api/v3/sections/lookup/1
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
    description: 'Returns a single section for lookup purposes',
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
    return this.sectionsService.lookupById(id);
  }

  /**
   * Retrieves a section by its unique identifier.
   *
   * This endpoint finds a section by its ID and returns the complete
   * section information including relationships and audit data.
   *
   * @param id - The unique identifier of the section
   * @returns Promise<Section> - The complete section information
   *
   * @example
   * ```typescript
   * GET /api/v3/sections/1
   * // Returns: { id: 1, section_code: '01', section_name: 'Engineering', ... }
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
    type: Section,
  })
  findById(@Param('id') id: number) {
    return this.sectionsService.findById(id);
  }

  /**
   * Updates an existing section with new information.
   *
   * This endpoint updates a section's properties while performing validation
   * to ensure code uniqueness and section head existence. It handles partial
   * updates and maintains data integrity through business rule validation.
   *
   * @param id - The unique identifier of the section to update
   * @param updateSectionDto - The updated section data
   * @param currentUser - The authenticated user performing the update
   * @returns Promise<Section> - The updated section
   *
   * @example
   * ```typescript
   * PATCH /api/v3/sections/1
   * {
   *   "section_name": "Advanced Engineering",
   *   "section_head": 456
   * }
   * // Returns: { id: 1, section_name: 'Advanced Engineering', ... }
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
    type: Section,
  })
  update(
    @Param('id') id: number,
    @Body() updateSectionDto: UpdateSectionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.sectionsService.update(id, updateSectionDto, currentUser);
  }

  /**
   * Performs bulk deletion of multiple sections.
   *
   * This endpoint deletes multiple sections in a single operation, providing
   * detailed results including successful deletions, failures, and error
   * messages. It processes each deletion individually for comprehensive feedback.
   *
   * @param bulkDeleteDto - DTO containing array of section IDs to delete
   * @param currentUser - The authenticated user performing the bulk deletion
   * @returns Promise<{ deleted: number; failed: number; errors: string[] }> - Bulk deletion results
   *
   * @example
   * ```typescript
   * DELETE /api/v3/sections/bulk-delete
   * {
   *   "ids": [1, 2, 3]
   * }
   * // Returns: { deleted: 2, failed: 1, errors: ['Section 3 not found'] }
   * ```
   */
  @Delete('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Bulk delete sections',
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
    @Body() bulkDeleteDto: BulkDeleteSectionsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.sectionsService.bulkDelete(bulkDeleteDto, currentUser);
  }

  /**
   * Updates a section status to Hold.
   *
   * This endpoint changes the status of a section to 'Hold',
   * temporarily suspending the section's operations while
   * preserving all data and relationships.
   *
   * @param id - The unique identifier of the section
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Section> - The updated section with Hold status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/sections/1/hold
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
    type: Section,
    description: 'Section status changed to Hold',
  })
  hold(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.sectionsService.updateStatus(id, 'Hold' as any, currentUser);
  }

  /**
   * Updates a section status to Active.
   *
   * This endpoint changes the status of a section to 'Active',
   * enabling the section's operations and making it available
   * for normal business processes.
   *
   * @param id - The unique identifier of the section
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Section> - The updated section with Active status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/sections/1/activate
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
    type: Section,
    description: 'Section status changed to Active',
  })
  activate(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.sectionsService.updateStatus(id, 'Active' as any, currentUser);
  }

  /**
   * Updates a section status to Cancelled.
   *
   * This endpoint changes the status of a section to 'Cancelled',
   * permanently disabling the section's operations while
   * preserving all data for audit purposes.
   *
   * @param id - The unique identifier of the section
   * @param currentUser - The authenticated user performing the action
   * @returns Promise<Section> - The updated section with Cancelled status
   *
   * @example
   * ```typescript
   * PATCH /api/v3/sections/1/cancel
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
    type: Section,
    description: 'Section status changed to Cancelled',
  })
  cancel(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.sectionsService.updateStatus(
      id,
      'Cancelled' as any,
      currentUser,
    );
  }

  /**
   * Soft deletes a section from the system.
   *
   * This endpoint performs a soft delete operation, marking the section
   * as deleted while preserving the data for audit purposes. It updates
   * the status to cancelled and records the deletion information.
   *
   * @param id - The unique identifier of the section to delete
   * @param currentUser - The authenticated user performing the deletion
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * DELETE /api/v3/sections/1
   * // Section is soft deleted and status set to cancelled
   * ```
   */
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.sectionsService.remove(id, currentUser);
  }
}
