import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSubSectionDto } from '@/masters/sub-sections/dto/create-sub-section.dto';
import { UpdateSubSectionDto } from '@/masters/sub-sections/dto/update-sub-section.dto';
import { BaseSubSectionRepository } from '@/masters/sub-sections/persistence/base-sub-section.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { SubSection } from '@/masters/sub-sections/domain/sub-section';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { FindAllSubSectionsDto } from '@/masters/sub-sections/dto/find-all-sub-sections.dto';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { BulkDeleteSubSectionsDto } from '@/masters/sub-sections/dto/bulk-delete-sub-sections.dto';

/**
 * Service for managing sub-sections in the organizational hierarchy.
 *
 * This service provides comprehensive business logic for sub-section operations,
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
 * const subSectionService = new SubSectionsService(subSectionRepository, usersService);
 * const subSection = await subSectionService.create(createSubSectionDto, causer);
 * ```
 */
@Injectable()
export class SubSectionsService {
  /**
   * Creates an instance of SubSectionsService.
   *
   * @param subSectionRepository - Repository for sub-section data operations
   * @param usersService - Service for user management and validation
   */
  constructor(
    private readonly subSectionRepository: BaseSubSectionRepository,
    private readonly usersService: UsersService,
  ) {}
  /**
   * Creates a new sub-section in the organizational hierarchy.
   *
   * This method validates the sub-section code uniqueness, ensures the sub-section head
   * exists, and creates a new sub-section with the provided information. It performs
   * business validation to prevent duplicate codes and ensures data integrity.
   *
   * @param createSubSectionDto - The sub-section data including code, name, and head
   * @param causer - The user performing the creation action
   * @returns Promise<SubSection> - The newly created sub-section
   *
   * @throws {UnprocessableEntityException} When sub-section code already exists
   * @throws {NotFoundException} When sub-section head does not exist
   *
   * @example
   * ```typescript
   * const subSection = await this.create({
   *   sub_section_code: '01',
   *   sub_section_name: 'Backend',
   *   sub_section_head: 123
   * }, causer);
   * // Returns: { id: 1, sub_section_code: '01', sub_section_name: 'Backend', ... }
   * ```
   */
  async create(createSubSectionDto: CreateSubSectionDto, causer: User) {
    // Do not remove comment below.
    // <creating-property />

    // check if code already exist
    const section = await this.subSectionRepository.findByCode(
      createSubSectionDto.sub_section_code,
    );

    if (section)
      throw new UnprocessableEntityException('SubSection code already exist!');

    const sub_section_head = await this.usersService.findById(
      createSubSectionDto.sub_section_head,
    );

    if (!sub_section_head)
      throw new NotFoundException('Section head does not exist!');

    return this.subSectionRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      sub_section_head,
      sub_section_code: createSubSectionDto.sub_section_code,
      sub_section_name: createSubSectionDto.sub_section_name,
      status: createSubSectionDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }
  /**
   * Retrieves sub-sections using DevExtreme-compatible query parameters.
   *
   * This method processes DevExtreme grid parameters including filtering,
   * sorting, and pagination. It supports complex filtering operations
   * and returns data in a format compatible with DevExtreme components.
   *
   * @param queryParams - DevExtreme query parameters including filter and sort
   * @returns Promise<DevExtremePaginatedResponseDto<SubSection>> - Paginated sub-section data
   *
   * @example
   * ```typescript
   * const result = await this.findByMany({
   *   filter: ['sub_section_name', 'contains', 'Backend'],
   *   sort: [{ selector: 'sub_section_code', desc: false }]
   * });
   * // Returns: { data: [...], totalCount: 10 }
   * ```
   */
  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter || [],
    };
    return this.subSectionRepository.findByMany(queryParamsParsed);
  }
  /**
   * Retrieves sub-sections with custom pagination and filtering.
   *
   * This method provides paginated access to sub-sections with custom
   * filtering capabilities. It supports search functionality across
   * sub-section fields and returns paginated results with metadata.
   *
   * @param filterQuery - Search criteria for filtering sub-sections
   * @param paginationOptions - Pagination settings including page and limit
   * @returns Promise<IPaginatedResult<SubSection>> - Paginated sub-section results
   *
   * @example
   * ```typescript
   * const result = await this.findAllWithPagination({
   *   filterQuery: 'Backend',
   *   paginationOptions: { page: 1, limit: 10 }
   * });
   * // Returns: { data: [...], totalResults: 25 }
   * ```
   */
  findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllSubSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }) {
    return this.subSectionRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }
  /**
   * Retrieves a sub-section by its unique identifier.
   *
   * This method finds a sub-section by its ID and returns the complete
   * sub-section information including relationships. It performs validation
   * to ensure the sub-section exists before returning the data.
   *
   * @param id - The unique identifier of the sub-section
   * @returns Promise<SubSection> - The sub-section with complete information
   *
   * @throws {NotFoundException} When sub-section with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const subSection = await this.findById(1);
   * // Returns: { id: 1, sub_section_code: '01', sub_section_name: 'Backend', ... }
   * ```
   */
  async findById(id: SubSection['id']) {
    const subSection = await this.subSectionRepository.findById(id);

    if (!subSection) throw new NotFoundException('Sub Section not found');

    return subSection;
  }
  /**
   * Retrieves multiple sub-sections by their identifiers.
   *
   * This method efficiently retrieves multiple sub-sections in a single query
   * using the provided array of IDs. It returns all matching sub-sections
   * without throwing errors for missing ones.
   *
   * @param ids - Array of sub-section identifiers to retrieve
   * @returns Promise<SubSection[]> - Array of found sub-sections
   *
   * @example
   * ```typescript
   * const subSections = await this.findByIds([1, 2, 3]);
   * // Returns: [{ id: 1, ... }, { id: 2, ... }]
   * ```
   */
  findByIds(ids: SubSection['id'][]) {
    return this.subSectionRepository.findByIds(ids);
  }
  /**
   * Retrieves a sub-section by its unique code.
   *
   * This method finds a sub-section using its business code rather than
   * the database ID. It's useful for business operations that reference
   * sub-sections by their human-readable codes.
   *
   * @param sub_section_code - The unique sub-section code
   * @returns Promise<SubSection> - The sub-section with the specified code
   *
   * @example
   * ```typescript
   * const subSection = await this.findByCode('01');
   * // Returns: { id: 1, sub_section_code: '01', sub_section_name: 'Backend', ... }
   * ```
   */
  findByCode(sub_section_code: SubSection['sub_section_code']) {
    return this.subSectionRepository.findByCode(sub_section_code);
  }
  /**
   * Retrieves all active sub-sections in the system.
   *
   * This method returns a simplified list of all active sub-sections
   * containing only essential information (id, code, name, head). It's
   * optimized for dropdown lists and selection components.
   *
   * @returns Promise<Pick<SubSection, 'id' | 'sub_section_code' | 'sub_section_name' | 'sub_section_head'>[]> - Array of active sub-sections
   *
   * @example
   * ```typescript
   * const subSections = await this.findAll();
   * // Returns: [{ id: 1, sub_section_code: '01', sub_section_name: 'Backend' }, ...]
   * ```
   */
  findAll() {
    return this.subSectionRepository.findAll();
  }
  /**
   * Retrieves distinct sub-section names from the system.
   *
   * This method returns a unique list of sub-section names, useful for
   * generating reports or analytics. It performs a distinct query
   * to eliminate duplicate names.
   *
   * @returns Promise<string[]> - Array of unique sub-section names
   *
   * @example
   * ```typescript
   * const names = await this.findDistinct();
   * // Returns: ['Backend', 'Frontend', 'DevOps']
   * ```
   */
  async findDistinct() {
    const sub_sections = await this.subSectionRepository.findDistinct();
    return sub_sections.map((sub_section) => sub_section.sub_section_name);
  }
  /**
   * Updates an existing sub-section with new information.
   *
   * This method updates a sub-section's properties while performing validation
   * to ensure code uniqueness and sub-section head existence. It handles partial
   * updates and maintains data integrity through business rule validation.
   *
   * @param id - The unique identifier of the sub-section to update
   * @param updateSubSectionDto - The updated sub-section data
   * @param causer - The user performing the update action
   * @returns Promise<SubSection> - The updated sub-section
   *
   * @throws {NotFoundException} When sub-section doesn't exist
   * @throws {UnprocessableEntityException} When new code already exists
   * @throws {NotFoundException} When new sub-section head doesn't exist
   *
   * @example
   * ```typescript
   * const updated = await this.update(1, {
   *   sub_section_name: 'Advanced Backend',
   *   sub_section_head: 456
   * }, causer);
   * // Returns: { id: 1, sub_section_name: 'Advanced Backend', ... }
   * ```
   */
  async update(
    id: SubSection['id'],
    updateSubSectionDto: UpdateSubSectionDto,
    causer: User,
  ): Promise<SubSection> {
    const subSection = await this.findById(id);
    const partialSubSection: Partial<SubSection> = new SubSection();

    if (!subSection) throw new NotFoundException('SubSection does not exist!');

    Object.assign(partialSubSection, updateSubSectionDto);

    // check if code already exist
    if (
      updateSubSectionDto.sub_section_code &&
      updateSubSectionDto.sub_section_code != subSection.sub_section_code
    ) {
      const subSectionCode = await this.subSectionRepository.findByCode(
        updateSubSectionDto.sub_section_code,
      );

      if (subSectionCode)
        throw new UnprocessableEntityException(
          'SubSection code already exist!',
        );
    }

    if (updateSubSectionDto.sub_section_head) {
      const subSectionHead = await this.usersService.findById(
        updateSubSectionDto.sub_section_head,
      );

      if (!subSectionHead)
        throw new NotFoundException('SubSection head does not exist!');

      partialSubSection.sub_section_head = subSectionHead;
    }

    partialSubSection.updated_by = causer;

    return this.subSectionRepository.update(id, partialSubSection);
  }
  /**
   * Soft deletes a sub-section from the system.
   *
   * This method performs a soft delete operation, marking the sub-section
   * as deleted while preserving the data for audit purposes. It updates
   * the status to cancelled and records the deletion information.
   *
   * @param id - The unique identifier of the sub-section to delete
   * @param causer - The user performing the deletion action
   * @returns Promise<void>
   *
   * @throws {NotFoundException} When sub-section doesn't exist
   *
   * @example
   * ```typescript
   * await this.remove(1, causer);
   * // Sub-section is soft deleted and status set to cancelled
   * ```
   */
  async remove(id: SubSection['id'], causer: User) {
    const subSection = await this.findById(id);

    if (!subSection) throw new NotFoundException('Section does not exist!');

    await this.subSectionRepository.remove(id, causer);
  }
  /**
   * Updates the status of a sub-section.
   *
   * This method changes the status of a sub-section to one of the valid
   * status values. It performs validation to ensure the sub-section exists
   * and the status is valid.
   *
   * @param id - The unique identifier of the sub-section
   * @param status - The new status for the sub-section
   * @param causer - The user performing the status update
   * @returns Promise<SubSection> - The updated sub-section
   *
   * @throws {NotFoundException} When sub-section doesn't exist
   *
   * @example
   * ```typescript
   * const subSection = await this.updateStatus(1, 'Hold', causer);
   * // Returns: { id: 1, status: 'Hold', ... }
   * ```
   */
  async updateStatus(
    id: SubSection['id'],
    status: StatusEnum,
    causer: User,
  ): Promise<SubSection> {
    const subSection = await this.findById(id);

    if (!subSection) {
      throw new NotFoundException('Sub-section does not exist!');
    }

    return this.subSectionRepository.update(id, {
      status,
      updated_by: causer,
    });
  }
  /**
   * Performs bulk deletion of multiple sub-sections.
   *
   * This method deletes multiple sub-sections in a single operation, providing
   * detailed results including successful deletions, failures, and error
   * messages. It processes each deletion individually to provide comprehensive
   * feedback on the operation results.
   *
   * @param bulkDeleteDto - DTO containing array of sub-section IDs to delete
   * @param causer - The user performing the bulk deletion
   * @returns Promise<{ deleted: number; failed: number; errors: string[] }> - Bulk deletion results
   *
   * @throws {BadRequestException} When no IDs provided or invalid IDs
   *
   * @example
   * ```typescript
   * const result = await this.bulkDelete({
   *   ids: [1, 2, 3]
   * }, causer);
   * // Returns: { deleted: 2, failed: 1, errors: ['Sub-section 3 not found'] }
   * ```
   */
  async bulkDelete(
    bulkDeleteDto: BulkDeleteSubSectionsDto,
    causer: User,
  ): Promise<{
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    const { ids } = bulkDeleteDto;

    if (!ids || ids.length === 0) {
      throw new BadRequestException('No sub-section IDs provided');
    }

    // Validate that all IDs are valid numbers
    const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid sub-section IDs: ${invalidIds.join(', ')}`,
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
          errors.push(`Sub-section ${id} not found`);
        } else {
          errors.push(`Failed to delete sub-section ${id}: ${error.message}`);
        }
      }
    }

    return { deleted, failed, errors };
  }
  /**
   * Performs a lookup operation for sub-section selection.
   *
   * This method provides optimized sub-section lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific sub-sections from the results.
   *
   * @param queryParams - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for sub-sections
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   *
   * @example
   * ```typescript
   * const result = await this.lookup({
   *   searchExpr: 'sub_section_name',
   *   searchOperation: 'contains',
   *   searchValue: 'Backend'
   * });
   * // Returns: { data: [{ id: 1, code: '01', name: 'Backend' }], totalCount: 1 }
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
    return await this.subSectionRepository.lookup(queryParamsParsed, exclude);
  }
  /**
   * Retrieves a sub-section for lookup purposes by ID.
   *
   * This method returns a simplified sub-section object containing only
   * essential fields (id, code, name) for lookup operations. It's
   * optimized for dropdown and selection components.
   *
   * @param id - The unique identifier of the sub-section
   * @returns Promise<{ id?: number; code?: string; name?: string }> - Simplified sub-section data
   *
   * @example
   * ```typescript
   * const subSection = await this.lookupById(1);
   * // Returns: { id: 1, code: '01', name: 'Backend' }
   * ```
   */
  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      code: result?.sub_section_code,
      name: result?.sub_section_name,
    };
  }
}
