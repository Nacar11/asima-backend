import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSectionDto } from '@/masters/sections/dto/create-section.dto';
import { UpdateSectionDto } from '@/masters/sections/dto/update-section.dto';
import { BaseSectionRepository } from '@/masters/sections/persistence/base-section.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Section } from '@/masters/sections/domain/section';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { FindAllSectionsDto } from '@/masters/sections/dto/find-all-sections.dto';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { BulkDeleteSectionsDto } from '@/masters/sections/dto/bulk-delete-sections.dto';

/**
 * Service for managing sections in the organizational hierarchy.
 *
 * This service provides comprehensive business logic for section operations,
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
 * const sectionService = new SectionsService(sectionRepository, usersService);
 * const section = await sectionService.create(createSectionDto, causer);
 * ```
 */
@Injectable()
export class SectionsService {
  /**
   * Creates an instance of SectionsService.
   *
   * @param sectionRepository - Repository for section data operations
   * @param usersService - Service for user management and validation
   */
  constructor(
    private readonly sectionRepository: BaseSectionRepository,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Creates a new section in the organizational hierarchy.
   *
   * This method validates the section code uniqueness, ensures the section head
   * exists, and creates a new section with the provided information. It performs
   * business validation to prevent duplicate codes and ensures data integrity.
   *
   * @param createSectionDto - The section data including code, name, and head
   * @param causer - The user performing the creation action
   * @returns Promise<Section> - The newly created section
   *
   * @throws {UnprocessableEntityException} When section code already exists
   * @throws {NotFoundException} When section head does not exist
   *
   * @example
   * ```typescript
   * const section = await this.create({
   *   section_code: '01',
   *   section_name: 'Engineering',
   *   section_head: 123
   * }, causer);
   * // Returns: { id: 1, section_code: '01', section_name: 'Engineering', ... }
   * ```
   */
  async create(createSectionDto: CreateSectionDto, causer: User) {
    // check if code already exist
    const section = await this.sectionRepository.findByCode(
      createSectionDto.section_code,
    );

    if (section)
      throw new UnprocessableEntityException('Section code already exist!');

    const section_head = await this.usersService.findById(
      createSectionDto.section_head,
    );

    if (!section_head)
      throw new NotFoundException('Section head does not exist!');

    return this.sectionRepository.create({
      section_head,
      section_code: createSectionDto.section_code,
      section_name: createSectionDto.section_name,
      status: createSectionDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  /**
   * Retrieves sections using DevExtreme-compatible query parameters.
   *
   * This method processes DevExtreme grid parameters including filtering,
   * sorting, and pagination. It supports complex filtering operations
   * and returns data in a format compatible with DevExtreme components.
   *
   * @param queryParams - DevExtreme query parameters including filter and sort
   * @returns Promise<DevExtremePaginatedResponseDto<Section>> - Paginated section data
   *
   * @example
   * ```typescript
   * const result = await this.findByMany({
   *   filter: ['section_name', 'contains', 'Engineering'],
   *   sort: [{ selector: 'section_code', desc: false }]
   * });
   * // Returns: { data: [...], totalCount: 10 }
   * ```
   */
  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.sectionRepository.findByMany(queryParamsParsed);
  }

  /**
   * Retrieves sections with custom pagination and filtering.
   *
   * This method provides paginated access to sections with custom
   * filtering capabilities. It supports search functionality across
   * section fields and returns paginated results with metadata.
   *
   * @param filterQuery - Search criteria for filtering sections
   * @param paginationOptions - Pagination settings including page and limit
   * @returns Promise<IPaginatedResult<Section>> - Paginated section results
   *
   * @example
   * ```typescript
   * const result = await this.findAllWithPagination({
   *   filterQuery: 'Engineering',
   *   paginationOptions: { page: 1, limit: 10 }
   * });
   * // Returns: { data: [...], totalResults: 25 }
   * ```
   */
  findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }) {
    return this.sectionRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  /**
   * Retrieves a section by its unique identifier.
   *
   * This method finds a section by its ID and returns the complete
   * section information including relationships. It performs validation
   * to ensure the section exists before returning the data.
   *
   * @param id - The unique identifier of the section
   * @returns Promise<Section> - The section with complete information
   *
   * @throws {NotFoundException} When section with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const section = await this.findById(1);
   * // Returns: { id: 1, section_code: '01', section_name: 'Engineering', ... }
   * ```
   */
  async findById(id: Section['id']) {
    const section = await this.sectionRepository.findById(id);

    if (!section) throw new NotFoundException('Section does not exist!');

    return section;
  }

  /**
   * Retrieves multiple sections by their identifiers.
   *
   * This method efficiently retrieves multiple sections in a single query
   * using the provided array of IDs. It returns all matching sections
   * without throwing errors for missing ones.
   *
   * @param ids - Array of section identifiers to retrieve
   * @returns Promise<Section[]> - Array of found sections
   *
   * @example
   * ```typescript
   * const sections = await this.findByIds([1, 2, 3]);
   * // Returns: [{ id: 1, ... }, { id: 2, ... }]
   * ```
   */
  findByIds(ids: Section['id'][]) {
    return this.sectionRepository.findByIds(ids);
  }

  /**
   * Retrieves a section by its unique code.
   *
   * This method finds a section using its business code rather than
   * the database ID. It's useful for business operations that reference
   * sections by their human-readable codes.
   *
   * @param code - The unique section code
   * @returns Promise<Section> - The section with the specified code
   *
   * @example
   * ```typescript
   * const section = await this.findByCode('01');
   * // Returns: { id: 1, section_code: '01', section_name: 'Engineering', ... }
   * ```
   */
  findByCode(code: Section['section_code']) {
    return this.sectionRepository.findByCode(code);
  }

  /**
   * Retrieves all active sections in the system.
   *
   * This method returns a simplified list of all active sections
   * containing only essential information (id, code, name). It's
   * optimized for dropdown lists and selection components.
   *
   * @returns Promise<Pick<Section, 'id' | 'section_code' | 'section_name'>[]> - Array of active sections
   *
   * @example
   * ```typescript
   * const sections = await this.findAll();
   * // Returns: [{ id: 1, section_code: '01', section_name: 'Engineering' }, ...]
   * ```
   */
  findAll() {
    return this.sectionRepository.findAll();
  }

  /**
   * Retrieves distinct section names from the system.
   *
   * This method returns a unique list of section names, useful for
   * generating reports or analytics. It performs a distinct query
   * to eliminate duplicate names.
   *
   * @returns Promise<string[]> - Array of unique section names
   *
   * @example
   * ```typescript
   * const names = await this.findDistinct();
   * // Returns: ['Engineering', 'Marketing', 'Sales']
   * ```
   */
  async findDistinct() {
    const sections = await this.sectionRepository.findDistinct();
    return sections.map((section) => section.section_name);
  }

  /**
   * Updates an existing section with new information.
   *
   * This method updates a section's properties while performing validation
   * to ensure code uniqueness and section head existence. It handles partial
   * updates and maintains data integrity through business rule validation.
   *
   * @param id - The unique identifier of the section to update
   * @param updateSectionDto - The updated section data
   * @param causer - The user performing the update action
   * @returns Promise<Section> - The updated section
   *
   * @throws {NotFoundException} When section doesn't exist
   * @throws {UnprocessableEntityException} When new code already exists
   * @throws {NotFoundException} When new section head doesn't exist
   *
   * @example
   * ```typescript
   * const updated = await this.update(1, {
   *   section_name: 'Advanced Engineering',
   *   section_head: 456
   * }, causer);
   * // Returns: { id: 1, section_name: 'Advanced Engineering', ... }
   * ```
   */
  async update(
    id: Section['id'],
    updateSectionDto: UpdateSectionDto,
    causer: User,
  ): Promise<Section> {
    const section = await this.findById(id);
    const partialSection: Partial<Section> = new Section();

    if (!section) throw new NotFoundException('Section does not exist!');

    Object.assign(partialSection, updateSectionDto);

    // check if code already exist
    if (
      updateSectionDto.section_code &&
      updateSectionDto.section_code != section.section_code
    ) {
      const sectionCode = await this.sectionRepository.findByCode(
        updateSectionDto.section_code,
      );

      if (sectionCode)
        throw new UnprocessableEntityException('Section code already exist!');
    }

    if (updateSectionDto.section_head) {
      const sectionHead = await this.usersService.findById(
        updateSectionDto.section_head,
      );

      if (!sectionHead)
        throw new NotFoundException('Section head does not exist!');

      partialSection.section_head = sectionHead;
    }

    partialSection.updated_by = causer;

    return this.sectionRepository.update(id, partialSection);
  }

  /**
   * Soft deletes a section from the system.
   *
   * This method performs a soft delete operation, marking the section
   * as deleted while preserving the data for audit purposes. It updates
   * the status to cancelled and records the deletion information.
   *
   * @param id - The unique identifier of the section to delete
   * @param causer - The user performing the deletion action
   * @returns Promise<void>
   *
   * @throws {NotFoundException} When section doesn't exist
   *
   * @example
   * ```typescript
   * await this.remove(1, causer);
   * // Section is soft deleted and status set to cancelled
   * ```
   */
  async remove(id: Section['id'], causer: User) {
    const section = await this.findById(id);

    if (!section) throw new NotFoundException('Section does not exist!');

    await this.sectionRepository.remove(id, causer);
  }

  /**
   * Updates the status of a section.
   *
   * This method changes the status of a section to one of the valid
   * status values. It performs validation to ensure the section exists
   * and the status is valid.
   *
   * @param id - The unique identifier of the section
   * @param status - The new status for the section
   * @param causer - The user performing the status update
   * @returns Promise<Section> - The updated section
   *
   * @throws {NotFoundException} When section doesn't exist
   *
   * @example
   * ```typescript
   * const section = await this.updateStatus(1, 'Hold', causer);
   * // Returns: { id: 1, status: 'Hold', ... }
   * ```
   */
  async updateStatus(
    id: Section['id'],
    status: StatusEnum,
    causer: User,
  ): Promise<Section> {
    const section = await this.findById(id);

    if (!section) {
      throw new NotFoundException('Section does not exist!');
    }

    return this.sectionRepository.update(id, {
      status,
      updated_by: causer,
    });
  }

  /**
   * Performs bulk deletion of multiple sections.
   *
   * This method deletes multiple sections in a single operation, providing
   * detailed results including successful deletions, failures, and error
   * messages. It processes each deletion individually to provide comprehensive
   * feedback on the operation results.
   *
   * @param bulkDeleteDto - DTO containing array of section IDs to delete
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
   * // Returns: { deleted: 2, failed: 1, errors: ['Section 3 not found'] }
   * ```
   */
  async bulkDelete(
    bulkDeleteDto: BulkDeleteSectionsDto,
    causer: User,
  ): Promise<{
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    const { ids } = bulkDeleteDto;

    if (!ids || ids.length === 0) {
      throw new BadRequestException('No section IDs provided');
    }

    // Validate that all IDs are valid numbers
    const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid section IDs: ${invalidIds.join(', ')}`,
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
          errors.push(`Section ${id} not found`);
        } else {
          errors.push(`Failed to delete section ${id}: ${error.message}`);
        }
      }
    }

    return { deleted, failed, errors };
  }

  /**
   * Performs a lookup operation for section selection.
   *
   * This method provides optimized section lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific sections from the results.
   *
   * @param queryParams - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for sections
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   *
   * @example
   * ```typescript
   * const result = await this.lookup({
   *   searchExpr: 'section_name',
   *   searchOperation: 'contains',
   *   searchValue: 'Engineering'
   * });
   * // Returns: { data: [{ id: 1, code: '01', name: 'Engineering' }], totalCount: 1 }
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
    return await this.sectionRepository.lookup(queryParamsParsed, exclude);
  }

  /**
   * Retrieves a section for lookup purposes by ID.
   *
   * This method returns a simplified section object containing only
   * essential fields (id, code, name) for lookup operations. It's
   * optimized for dropdown and selection components.
   *
   * @param id - The unique identifier of the section
   * @returns Promise<{ id?: number; code?: string; name?: string }> - Simplified section data
   *
   * @example
   * ```typescript
   * const section = await this.lookupById(1);
   * // Returns: { id: 1, code: '01', name: 'Engineering' }
   * ```
   */
  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      code: result?.section_code,
      name: result?.section_name,
    };
  }
}
