import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCostCenterDto } from '@/masters/cost-centers/dto/create-cost-center.dto';
import { UpdateCostCenterDto } from '@/masters/cost-centers/dto/update-cost-center.dto';
import { BaseCostCenterRepository } from '@/masters/cost-centers/persistence/base-cost-center.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { CostCenter } from '@/masters/cost-centers/domain/cost-center';
import { DivisionsService } from '@/masters/divisions/divisions.service';
import { DepartmentsService } from '@/masters/departments/departments.service';
import { SectionsService } from '@/masters/sections/sections.service';
import { SubSectionsService } from '@/masters/sub-sections/sub-sections.service';
import { FindAllCostCentersDto } from '@/masters/cost-centers/dto/find-all-cost-centers.dto';
import { Division } from '@/masters/divisions/domain/division';
import { Department } from '@/masters/departments/domain/department';
import { Section } from '@/masters/sections/domain/section';
import { SubSection } from '@/masters/sub-sections/domain/sub-section';
import { User } from '@/users/domain/user';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';

/**
 * Type definition for cost center related entities.
 *
 * Represents the organizational structure entities that can be associated
 * with a cost center. All entities except division are optional, allowing
 * for flexible organizational hierarchies.
 *
 * @interface CostCenterEntities
 */
type CostCenterEntities = {
  /** Required division entity */
  division: Division;
  /** Optional department entity */
  department: Department | null;
  /** Optional section entity */
  section: Section | null;
  /** Optional sub-section entity */
  sub_section: SubSection | null;
};

/**
 * Service for managing cost centers in the organizational hierarchy.
 *
 * This service provides comprehensive business logic for cost center operations,
 * including creation, retrieval, updates, status management, and bulk operations.
 * Cost centers are automatically generated based on organizational structure
 * and follow a hierarchical code system.
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
@Injectable()
export class CostCentersService {
  /**
   * Creates an instance of CostCentersService.
   *
   * @param costCenterRepository - Repository for cost center data operations
   * @param divisionService - Service for division entity operations
   * @param departmentService - Service for department entity operations
   * @param sectionService - Service for section entity operations
   * @param subSectionService - Service for sub-section entity operations
   */
  constructor(
    private readonly costCenterRepository: BaseCostCenterRepository,
    private readonly divisionService: DivisionsService,
    private readonly departmentService: DepartmentsService,
    private readonly sectionService: SectionsService,
    private readonly subSectionService: SubSectionsService,
  ) {}

  /**
   * Creates a new cost center in the organizational hierarchy.
   *
   * The cost center code is automatically generated based on the provided
   * organizational structure (division, department, section, sub-section).
   * The system validates that all referenced entities exist and generates
   * a unique cost center code following the pattern: division + department + section + sub_section.
   *
   * @param createCostCenterDto - The cost center creation data
   * @param causer - The user creating the cost center
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
  async create(createCostCenterDto: CreateCostCenterDto, causer: User) {
    const entities = await this.getCostCenterEntities(createCostCenterDto);
    const cost_center_code = this.generateCostCenterCode(entities);
    const { division, department, section, sub_section } = entities;

    // check if code already exist
    const costCenterCode =
      await this.costCenterRepository.findByCode(cost_center_code);

    if (costCenterCode)
      throw new UnprocessableEntityException('CostCenter code already exist!');

    const costCenter = await this.costCenterRepository.create({
      cost_center_code,
      division,
      department,
      section,
      sub_section,
      remarks: createCostCenterDto.remarks ?? null,
      status: createCostCenterDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });

    return costCenter;
  }

  /**
   * Retrieves cost centers with DevExtreme-compatible filtering and pagination.
   *
   * This method supports advanced filtering, sorting, and pagination
   * compatible with DevExtreme DataGrid components. It provides a flexible
   * query interface for complex data operations.
   *
   * @param queryParams - DevExtreme query parameters for filtering and pagination
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
  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.costCenterRepository.findByMany(queryParamsParsed);
  }

  /**
   * Retrieves cost centers with standard pagination and filtering.
   *
   * This method provides a simplified pagination interface with search
   * capabilities and status filtering. It's designed for standard web
   * applications that don't require DevExtreme-specific features.
   *
   * @param filterQuery - Search term to filter cost centers by code or name
   * @param paginationOptions - Pagination options including page, limit, and status filter
   * @returns Promise<IPaginatedResult<CostCenter>> - Paginated cost centers result
   *
   * @example
   * ```typescript
   * const result = await this.findAllWithPagination({
   *   filterQuery: 'Backend',
   *   paginationOptions: {
   *     page: 1,
   *     limit: 20,
   *     status: [StatusEnum.ACTIVE]
   *   }
   * });
   * ```
   */
  findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllCostCentersDto['search'];
    paginationOptions: IPaginationOptions & { status: StatusEnum[] | 'all' };
  }) {
    return this.costCenterRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
        status: paginationOptions.status,
      },
    });
  }

  /**
   * Retrieves a specific cost center by its unique identifier.
   *
   * Returns the complete cost center entity with all related organizational
   * structure information (division, department, section, sub-section).
   * This method provides full details for detailed views and forms.
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
  async findById(id: CostCenter['id']) {
    const costCenter = await this.costCenterRepository.findById(id);

    if (!costCenter) throw new NotFoundException('CostCenter does not exist!');

    return costCenter;
  }
  /**
   * Retrieves a cost center by ID or throws an exception if not found.
   *
   * This method is a direct pass-through to the repository's findByIdOrFail method.
   * It's useful when you want to ensure a cost center exists before proceeding
   * with operations that depend on it.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise<CostCenter> - The cost center entity
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const costCenter = await this.findByIdOrFail(1);
   * // Throws NotFoundException if cost center doesn't exist
   * ```
   */
  async findByIdOrFail(id: CostCenter['id']) {
    return await this.costCenterRepository.findByIdOrFail(id);
  }

  /**
   * Retrieves multiple cost centers by their IDs.
   *
   * Returns an array of cost centers matching the provided IDs.
   * This method is useful for bulk operations and batch processing.
   *
   * @param ids - Array of cost center IDs to retrieve
   * @returns Promise<CostCenter[]> - Array of cost center entities
   *
   * @example
   * ```typescript
   * const costCenters = await this.findByIds([1, 2, 3, 4, 5]);
   * // Returns: [{ id: 1, ... }, { id: 2, ... }, ...]
   * ```
   */
  findByIds(ids: CostCenter['id'][]) {
    return this.costCenterRepository.findByIds(ids);
  }

  /**
   * Retrieves all cost centers without pagination.
   *
   * Returns a simplified list of all cost centers with basic information
   * (id, code, name) suitable for dropdowns, lookups, and simple listings.
   * This method is optimized for performance and doesn't include
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
  findAll() {
    return this.costCenterRepository.findAll();
  }

  /**
   * Retrieves all distinct cost center codes.
   *
   * Returns an array of unique cost center codes from the database.
   * This method is useful for validation, reporting, and data analysis.
   *
   * @returns Promise<string[]> - Array of unique cost center codes
   *
   * @example
   * ```typescript
   * const codes = await this.findDistinct();
   * // Returns: ['01010101', '01010102', '02010101', ...]
   * ```
   */
  async findDistinct() {
    const cost_centers = await this.costCenterRepository.findDistinct();
    return cost_centers.map((cost_center) => cost_center.cost_center_code);
  }

  /**
   * Retrieves a cost center by its unique code.
   *
   * Searches for a cost center using its generated code (e.g., '01010101').
   * This method is useful when you have the cost center code but need
   * the full entity information.
   *
   * @param costCenterCode - The unique cost center code
   * @returns Promise<CostCenter> - The cost center entity
   *
   * @throws {NotFoundException} When cost center with the specified code doesn't exist
   *
   * @example
   * ```typescript
   * const costCenter = await this.findByCode('01010101');
   * // Returns: { id: 1, cost_center_code: '01010101', ... }
   * ```
   */
  async findByCode(costCenterCode: CostCenter['cost_center_code']) {
    const costCenter =
      await this.costCenterRepository.findByCode(costCenterCode);

    if (!costCenter) throw new NotFoundException('CostCenter does not exist!');

    return costCenter;
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
   * @param causer - The user performing the update
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
  async update(
    id: CostCenter['id'],
    updateCostCenterDto: UpdateCostCenterDto,
    causer: User,
  ) {
    const costCenter = await this.findById(id);
    const partialCostCenter: Partial<CostCenter> = new CostCenter();

    if (!costCenter) throw new NotFoundException('CostCenter does not exist!');

    Object.assign(partialCostCenter, updateCostCenterDto, {
      updated_by: causer,
    });

    const entities = await this.getCostCenterEntities(updateCostCenterDto);
    const cost_center_code = this.generateCostCenterCode(entities);
    const { division, department, section, sub_section } = entities;

    if (cost_center_code && costCenter.cost_center_code !== cost_center_code) {
      // check if code already exist
      const costCenterCode =
        await this.costCenterRepository.findByCode(cost_center_code);

      if (costCenterCode)
        throw new UnprocessableEntityException(
          'CostCenter code already exist!',
        );

      partialCostCenter.cost_center_code = cost_center_code;
      partialCostCenter.division = division;
      partialCostCenter.department = department;
      partialCostCenter.section = section;
      partialCostCenter.sub_section = sub_section;
    }

    await this.costCenterRepository.update(id, partialCostCenter);

    return this.findById(id);
  }
  /**
   * Soft deletes a cost center.
   *
   * Performs a soft delete operation on the cost center, marking it as
   * deleted without removing it from the database. The cost center
   * will be hidden from normal queries but can be recovered if needed.
   *
   * @param id - The unique identifier of the cost center to delete
   * @param causer - The user performing the deletion
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
  async remove(id: CostCenter['id'], causer: User) {
    const costCenter = await this.findById(id);

    if (!costCenter) throw new NotFoundException('CostCenter does not exist!');

    await this.costCenterRepository.remove(id, causer);
  }

  /**
   * Performs a lookup search for cost centers with advanced filtering.
   *
   * This method is designed for autocomplete, search suggestions, and
   * lookup operations. It supports complex filtering expressions and
   * exclusion of specific items. The response includes only essential
   * fields (id, code, name) for optimal performance.
   *
   * @param queryParams - Lookup query parameters with filtering options
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
    return await this.costCenterRepository.lookup(queryParamsParsed, exclude);
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
  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      code: result?.cost_center_code,
      name: result?.cost_center_name,
    };
  }

  /**
   * Retrieves and validates organizational entities for cost center creation/update.
   *
   * This private method fetches the related organizational entities (division,
   * department, section, sub-section) based on the provided codes and validates
   * their existence. It ensures data integrity by checking that all referenced
   * entities exist before proceeding with cost center operations.
   *
   * @param costCenterDto - The cost center DTO containing organizational codes
   * @returns Promise<CostCenterEntities> - Validated organizational entities
   *
   * @throws {NotFoundException} When any referenced organizational entity doesn't exist
   *
   * @private
   */
  private async getCostCenterEntities(
    costCenterDto: CreateCostCenterDto | UpdateCostCenterDto,
  ): Promise<CostCenterEntities> {
    const entities: CostCenterEntities = new Object() as CostCenterEntities;

    if (costCenterDto.division) {
      const division = await this.divisionService.findByCode(
        costCenterDto.division,
      );

      if (!division) throw new NotFoundException('Division does not exist!');

      entities.division = division;
    }

    if (costCenterDto.department) {
      const department = await this.departmentService.findByCode(
        costCenterDto.department,
      );

      if (!department)
        throw new NotFoundException('Department does not exist!');

      entities.department = department;
    }

    if (costCenterDto.section) {
      const section = await this.sectionService.findByCode(
        costCenterDto.section,
      );

      if (!section) throw new NotFoundException('Department does not exist!');

      entities.section = section;
    }

    if (costCenterDto.sub_section) {
      const sub_section = await this.subSectionService.findByCode(
        costCenterDto.sub_section,
      );

      if (!sub_section)
        throw new NotFoundException('SubSection does not exist!');

      entities.sub_section = sub_section;
    }

    return entities;
  }

  /**
   * Generates a unique cost center code from organizational entities.
   *
   * This private method creates a cost center code by concatenating the codes
   * of the associated organizational entities (division, department, section, sub-section).
   * The resulting code follows the pattern: division + department + section + sub_section.
   *
   * @param entities - The organizational entities to generate code from
   * @returns string - The generated cost center code
   *
   * @private
   *
   * @example
   * ```typescript
   * const code = this.generateCostCenterCode({
   *   division: { division_code: '01' },
   *   department: { department_code: '01' },
   *   section: { section_code: '01' },
   *   sub_section: { sub_section_code: '01' }
   * });
   * // Returns: '01010101'
   * ```
   */
  private generateCostCenterCode(entities: CostCenterEntities): string {
    const cost_center_code: (string | null)[] = [
      entities.division?.division_code ?? '',
      entities.department?.department_code ?? '',
      entities.section?.section_code ?? '',
      entities.sub_section?.sub_section_code ?? '',
    ];

    return cost_center_code.join('');
  }
  /**
   * Performs bulk deletion of multiple cost centers.
   *
   * Deletes up to 100 cost centers in a single operation. Each deletion
   * is processed individually, and the operation continues even if some
   * deletions fail. Returns a summary of successful and failed deletions
   * with detailed error information.
   *
   * @param ids - Array of cost center IDs to delete (1-100 items)
   * @param causer - The user performing the bulk deletion
   * @returns Promise with deletion summary including counts and errors
   *
   * @throws {BadRequestException} When no IDs provided or invalid ID format
   *
   * @example
   * ```typescript
   * const result = await this.bulkDelete([1, 2, 3, 4, 5], currentUser);
   * // Returns: { deleted: 4, failed: 1, errors: ['Cost center 5 not found'] }
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
      throw new BadRequestException('No cost center IDs provided');
    }

    // Validate that all IDs are valid numbers
    const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid cost center IDs: ${invalidIds.join(', ')}`,
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
          errors.push(`Cost center ${id} not found`);
        } else {
          errors.push(`Failed to delete cost center ${id}: ${error.message}`);
        }
      }
    }

    return {
      deleted,
      failed,
      errors,
    };
  }
  /**
   * Updates the status of a cost center.
   *
   * Changes the cost center status to one of the valid statuses: Active, Hold, or Cancelled.
   * This method validates the status and ensures the cost center exists before
   * performing the update. It uses the existing update method internally.
   *
   * @param id - The unique identifier of the cost center
   * @param status - The new status to set (Active, Hold, or Cancelled)
   * @param causer - The user performing the status update
   * @returns Promise<CostCenter> - The updated cost center with new status
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   * @throws {BadRequestException} When invalid status is provided
   *
   * @example
   * ```typescript
   * const costCenter = await this.updateStatus(1, 'Hold', currentUser);
   * // Returns: { id: 1, status: 'Hold', ... }
   * ```
   */
  async updateStatus(
    id: number,
    status: 'Active' | 'Hold' | 'Cancelled',
    causer: User,
  ): Promise<CostCenter> {
    // Validate status
    const validStatuses = ['Active', 'Hold', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    // Get the cost center first to ensure it exists
    const costCenter = await this.findById(id);
    if (!costCenter) {
      throw new NotFoundException('CostCenter does not exist!');
    }

    // Update the status using the existing update method
    const updateDto: UpdateCostCenterDto = {
      status: status as StatusEnum,
    };
    return this.update(id, updateDto, causer);
  }
}
