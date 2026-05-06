import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import {
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { CreateDivisionDto } from '@/masters/divisions/dto/create-division.dto';
import { UpdateDivisionDto } from '@/masters/divisions/dto/update-division.dto';
import { BaseDivisionRepository } from '@/masters/divisions/persistence/base-division.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Division } from '@/masters/divisions/domain/division';
import { FindAllDivisionsDto } from '@/masters/divisions/dto/find-all-divisions.dto';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';

/**
 * Service for managing divisions in the organizational hierarchy.
 *
 * This service provides comprehensive business logic for division operations,
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
 * const divisionService = new DivisionsService(usersService, divisionRepository);
 * const division = await divisionService.create(createDivisionDto, causer);
 * ```
 */
@Injectable()
export class DivisionsService {
  /**
   * Creates an instance of DivisionsService.
   *
   * @param usersService - Service for user management and validation
   * @param divisionRepository - Repository for division data operations
   */
  constructor(
    private readonly usersService: UsersService,
    private readonly divisionRepository: BaseDivisionRepository,
  ) {}

  /**
   * Creates a new division in the organizational hierarchy.
   *
   * This method validates the division code uniqueness, ensures the division head
   * exists, and creates a new division with the provided information. It performs
   * business validation to prevent duplicate codes and ensures data integrity.
   *
   * @param createDivisionDto - The division data including code, name, and head
   * @param causer - The user performing the creation action
   * @returns Promise<Division> - The newly created division
   *
   * @throws {UnprocessableEntityException} When division code already exists
   * @throws {NotFoundException} When division head does not exist
   *
   * @example
   * ```typescript
   * const division = await this.create({
   *   division_code: '01',
   *   division_name: 'Engineering',
   *   division_head: 123
   * }, causer);
   * // Returns: { id: 1, division_code: '01', division_name: 'Engineering', ... }
   * ```
   */
  async create(createDivisionDto: CreateDivisionDto, causer: User) {
    // check if code already exist
    const division = await this.divisionRepository.findByCode(
      createDivisionDto.division_code,
    );

    if (division)
      throw new UnprocessableEntityException('Division code already exist!');

    const division_head = await this.usersService.findById(
      createDivisionDto.division_head,
    );

    if (!division_head)
      throw new NotFoundException('Division head does not exist!');

    return this.divisionRepository.create({
      division_head,
      division_code: createDivisionDto.division_code,
      division_name: createDivisionDto.division_name,
      status: createDivisionDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  /**
   * Retrieves divisions using DevExtreme-compatible query parameters.
   *
   * This method processes DevExtreme grid parameters including filtering,
   * sorting, and pagination. It supports complex filtering operations
   * and returns data in a format compatible with DevExtreme components.
   *
   * @param queryParams - DevExtreme query parameters including filter and sort
   * @returns Promise<DevExtremePaginatedResponseDto<Division>> - Paginated division data
   *
   * @example
   * ```typescript
   * const result = await this.findByMany({
   *   filter: ['division_name', 'contains', 'Engineering'],
   *   sort: [{ selector: 'division_code', desc: false }]
   * });
   * // Returns: { data: [...], totalCount: 10 }
   * ```
   */
  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.divisionRepository.findByMany(queryParamsParsed);
  }

  /**
   * Retrieves divisions with custom pagination and filtering.
   *
   * This method provides paginated access to divisions with custom filtering
   * capabilities. It supports search functionality across division fields
   * and returns paginated results with metadata.
   *
   * @param filterQuery - Search criteria for filtering divisions
   * @param paginationOptions - Pagination settings including page and limit
   * @returns Promise<IPaginatedResult<Division>> - Paginated division results
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
    filterQuery: FindAllDivisionsDto['search'];
    paginationOptions: IPaginationOptions;
  }) {
    return this.divisionRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  /**
   * Retrieves a division by its unique identifier.
   *
   * This method finds a division by its ID and returns the complete
   * division information including relationships. It performs validation
   * to ensure the division exists before returning the data.
   *
   * @param id - The unique identifier of the division
   * @returns Promise<Division> - The division with complete information
   *
   * @throws {NotFoundException} When division with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const division = await this.findById(1);
   * // Returns: { id: 1, division_code: '01', division_name: 'Engineering', ... }
   * ```
   */
  async findById(id: Division['id']) {
    const division = await this.divisionRepository.findById(id);

    if (!division) throw new NotFoundException('Division does not exist!');

    return division;
  }

  /**
   * Retrieves multiple divisions by their identifiers.
   *
   * This method efficiently retrieves multiple divisions in a single query
   * using the provided array of IDs. It returns all matching divisions
   * without throwing errors for missing ones.
   *
   * @param ids - Array of division identifiers to retrieve
   * @returns Promise<Division[]> - Array of found divisions
   *
   * @example
   * ```typescript
   * const divisions = await this.findByIds([1, 2, 3]);
   * // Returns: [{ id: 1, ... }, { id: 2, ... }]
   * ```
   */
  findByIds(ids: Division['id'][]) {
    return this.divisionRepository.findByIds(ids);
  }

  /**
   * Retrieves a division by its unique code.
   *
   * This method finds a division using its business code rather than
   * the database ID. It's useful for business operations that reference
   * divisions by their human-readable codes.
   *
   * @param code - The unique division code
   * @returns Promise<Division> - The division with the specified code
   *
   * @throws {NotFoundException} When division with the specified code doesn't exist
   *
   * @example
   * ```typescript
   * const division = await this.findByCode('01');
   * // Returns: { id: 1, division_code: '01', division_name: 'Engineering', ... }
   * ```
   */
  findByCode(code: Division['division_code']) {
    const division = this.divisionRepository.findByCode(code);

    if (!division) throw new NotFoundException('Division does not exist!');

    return division;
  }

  /**
   * Retrieves all active divisions in the system.
   *
   * This method returns a simplified list of all active divisions
   * containing only essential information (id, code, name). It's
   * optimized for dropdown lists and selection components.
   *
   * @returns Promise<Pick<Division, 'id' | 'division_code' | 'division_name'>[]> - Array of active divisions
   *
   * @example
   * ```typescript
   * const divisions = await this.findAll();
   * // Returns: [{ id: 1, division_code: '01', division_name: 'Engineering' }, ...]
   * ```
   */
  findAll() {
    return this.divisionRepository.findAll();
  }

  /**
   * Retrieves distinct division names from the system.
   *
   * This method returns a unique list of division names, useful for
   * generating reports or analytics. It performs a distinct query
   * to eliminate duplicate names.
   *
   * @returns Promise<string[]> - Array of unique division names
   *
   * @example
   * ```typescript
   * const names = await this.findDistinct();
   * // Returns: ['Engineering', 'Marketing', 'Sales']
   * ```
   */
  async findDistinct() {
    const divisions = await this.divisionRepository.findDistinct();
    return divisions.map((division) => division.division_name);
  }

  /**
   * Updates an existing division with new information.
   *
   * This method updates a division's properties while performing validation
   * to ensure code uniqueness and division head existence. It handles partial
   * updates and maintains data integrity through business rule validation.
   *
   * @param id - The unique identifier of the division to update
   * @param updateDivisionDto - The updated division data
   * @param causer - The user performing the update action
   * @returns Promise<Division> - The updated division
   *
   * @throws {NotFoundException} When division doesn't exist
   * @throws {UnprocessableEntityException} When new code already exists
   * @throws {NotFoundException} When new division head doesn't exist
   *
   * @example
   * ```typescript
   * const updated = await this.update(1, {
   *   division_name: 'Advanced Engineering',
   *   division_head: 456
   * }, causer);
   * // Returns: { id: 1, division_name: 'Advanced Engineering', ... }
   * ```
   */
  async update(
    id: Division['id'],
    updateDivisionDto: UpdateDivisionDto,
    causer: User,
  ): Promise<Division> {
    const division = await this.findById(id);
    const partialDivision: Partial<Division> = new Division();

    if (!division) throw new NotFoundException('Division does not exist!');

    Object.assign(partialDivision, updateDivisionDto);

    // check if code already exist
    if (
      updateDivisionDto.division_code &&
      updateDivisionDto.division_code != division.division_code
    ) {
      const divisionCode = await this.divisionRepository.findByCode(
        updateDivisionDto.division_code,
      );

      if (divisionCode)
        throw new UnprocessableEntityException('Division code already exist!');
    }

    if (updateDivisionDto.division_head) {
      const divisionHead = await this.usersService.findById(
        updateDivisionDto.division_head,
      );

      if (!divisionHead)
        throw new NotFoundException('Division head does not exist!');

      partialDivision.division_head = divisionHead;
    }

    partialDivision.updated_by = causer;

    return this.divisionRepository.update(id, partialDivision);
  }

  /**
   * Soft deletes a division from the system.
   *
   * This method performs a soft delete operation, marking the division
   * as deleted while preserving the data for audit purposes. It updates
   * the status to cancelled and records the deletion information.
   *
   * @param id - The unique identifier of the division to delete
   * @param causer - The user performing the deletion action
   * @returns Promise<void>
   *
   * @throws {NotFoundException} When division doesn't exist
   *
   * @example
   * ```typescript
   * await this.remove(1, causer);
   * // Division is soft deleted and status set to cancelled
   * ```
   */
  async remove(id: Division['id'], causer: User) {
    const division = await this.findById(id);

    if (!division) throw new NotFoundException('Division does not exist!');

    await this.divisionRepository.remove(id, causer);
  }

  /**
   * Performs a lookup operation for division selection.
   *
   * This method provides optimized division lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific divisions from the results.
   *
   * @param queryParams - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for divisions
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   *
   * @example
   * ```typescript
   * const result = await this.lookup({
   *   searchExpr: 'division_name',
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
    return await this.divisionRepository.lookup(queryParamsParsed, exclude);
  }

  /**
   * Retrieves a division for lookup purposes by ID.
   *
   * This method returns a simplified division object containing only
   * essential fields (id, code, name) for lookup operations. It's
   * optimized for dropdown and selection components.
   *
   * @param id - The unique identifier of the division
   * @returns Promise<{ id?: number; code?: string; name?: string }> - Simplified division data
   *
   * @example
   * ```typescript
   * const division = await this.lookupById(1);
   * // Returns: { id: 1, code: '01', name: 'Engineering' }
   * ```
   */
  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      code: result?.division_code,
      name: result?.division_name,
    };
  }

  /**
   * Updates the status of a division.
   *
   * This method changes the status of a division to one of the valid
   * status values (Active, Hold, Cancelled). It performs validation
   * to ensure the status is valid and the division exists.
   *
   * @param id - The unique identifier of the division
   * @param status - The new status for the division
   * @param causer - The user performing the status update
   * @returns Promise<Division> - The updated division
   *
   * @throws {BadRequestException} When invalid status is provided
   * @throws {NotFoundException} When division doesn't exist
   *
   * @example
   * ```typescript
   * const division = await this.updateStatus(1, 'Hold', causer);
   * // Returns: { id: 1, status: 'Hold', ... }
   * ```
   */
  async updateStatus(
    id: number,
    status: 'Active' | 'Hold' | 'Cancelled',
    causer: User,
  ): Promise<Division> {
    // Validate status
    const validStatuses = ['Active', 'Hold', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    // Get the division first to ensure it exists
    const division = await this.findById(id);
    if (!division) {
      throw new NotFoundException('Division does not exist!');
    }

    // Update the status using the existing update method
    const updateDto: UpdateDivisionDto = {
      status: status as StatusEnum,
    };
    return this.update(id, updateDto, causer);
  }

  /**
   * Performs bulk deletion of multiple divisions.
   *
   * This method deletes multiple divisions in a single operation, providing
   * detailed results including successful deletions, failures, and error
   * messages. It processes each deletion individually to provide comprehensive
   * feedback on the operation results.
   *
   * @param ids - Array of division identifiers to delete
   * @param causer - The user performing the bulk deletion
   * @returns Promise<{ deleted: number; failed: number; errors: string[] }> - Bulk deletion results
   *
   * @throws {BadRequestException} When no IDs provided or invalid IDs
   *
   * @example
   * ```typescript
   * const result = await this.bulkDelete([1, 2, 3], causer);
   * // Returns: { deleted: 2, failed: 1, errors: ['Division 3 not found'] }
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
      throw new BadRequestException('No division IDs provided');
    }

    // Validate that all IDs are valid numbers
    const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid division IDs: ${invalidIds.join(', ')}`,
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
          errors.push(`Division ${id} not found`);
        } else {
          errors.push(`Failed to delete division ${id}: ${error.message}`);
        }
      }
    }

    return {
      deleted,
      failed,
      errors,
    };
  }
}
