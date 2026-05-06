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
import { MasterStatusEnum, StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { ClsService } from 'nestjs-cls';

/**
 * Type definition for cost center related entities
 * Used internally to manage the hierarchical organization structure
 */
type CostCenterEntities = {
  division: Division;
  department: Department | null;
  section: Section | null;
  sub_section: SubSection | null;
};

/**
 * Cost Centers Service
 *
 * Provides business logic for cost center management including:
 * - Creating cost centers with automatic code generation
 * - Retrieving cost centers with complete related entity data
 * - Updating cost centers and maintaining audit trails
 * - Soft deleting cost centers
 * - Lookup operations for UI components
 *
 * The service ensures that all cost center operations include complete
 * organizational hierarchy data (division, department, section, sub-section)
 * and user audit information (created_by, updated_by, deleted_by).
 *
 * @example
 * ```typescript
 * // Get cost center with all related data
 * const costCenter = await costCentersService.findById(6);
 * // Returns: { id, cost_center_code, division, department, section, sub_section, created_by, updated_by, deleted_by, cost_center_name }
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
@Injectable()
export class CostCentersService {
  /**
   * Creates a new instance of CostCentersService
   *
   * @param costCenterRepository - Repository for cost center data operations
   * @param divisionService - Service for division entity operations
   * @param departmentService - Service for department entity operations
   * @param sectionService - Service for section entity operations
   * @param subSectionService - Service for sub-section entity operations
   */
  constructor(
    private readonly clsService: ClsService,
    private readonly costCenterRepository: BaseCostCenterRepository,
    private readonly divisionService: DivisionsService,
    private readonly departmentService: DepartmentsService,
    private readonly sectionService: SectionsService,
    private readonly subSectionService: SubSectionsService,
  ) {}

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

  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.costCenterRepository.findByMany(queryParamsParsed);
  }

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
   * Retrieves a cost center by ID with complete related entity data
   *
   * This method was recently updated to ensure all related entities are loaded:
   * - Division, department, section, and sub-section information
   * - User audit information (created_by, updated_by, deleted_by)
   * - Computed cost_center_name field
   *
   * The repository's findById method now includes all necessary relations
   * to provide a complete cost center response.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise<CostCenter> - The cost center with all related entities
   *
   * @example
   * ```typescript
   * const costCenter = await costCentersService.findById(6);
   * // Returns complete cost center with division, department, section, sub_section, and user audit data
   * ```
   *
   * @throws {NotFoundException} When cost center with given ID does not exist
   */
  async findById(id: CostCenter['id']) {
    const costCenter = await this.costCenterRepository.findById(id);

    if (!costCenter) throw new NotFoundException('CostCenter does not exist!');

    return costCenter;
  }

  async findByIdOrFail(id: CostCenter['id']) {
    return await this.costCenterRepository.findByIdOrFail(id);
  }

  findByIds(ids: CostCenter['id'][]) {
    return this.costCenterRepository.findByIds(ids);
  }

  findAll() {
    return this.costCenterRepository.findAll();
  }

  async findDistinct() {
    const cost_centers = await this.costCenterRepository.findDistinct();
    return cost_centers.map((cost_center) => cost_center.cost_center_code);
  }

  async findByCode(costCenterCode: CostCenter['cost_center_code']) {
    const costCenter =
      await this.costCenterRepository.findByCode(costCenterCode);

    if (!costCenter) throw new NotFoundException('CostCenter does not exist!');

    return costCenter;
  }

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

  async bulkHold(ids: CostCenter['id'][]) {
    const causer = this.clsService.get('currentUser');
    const currencies = await this.costCenterRepository.findByIds(ids);
    if (currencies.length === 0) {
      throw new NotFoundException('No currencies found for the provided IDs.');
    }

    const alreadyHold = currencies.filter(
      (c) => c.status === MasterStatusEnum.HOLD,
    );

    if (alreadyHold.length > 0) {
      const controlNos = alreadyHold.map((c) => c.cost_center_code).join(', ');
      throw new BadRequestException(
        `The following Currencies are already on HOLD: ${controlNos}`,
      );
    }

    const nonActive = currencies.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.cost_center_code).join(', ');
      throw new BadRequestException(
        `The following Cost Centers are not in ACTIVE status and cannot be HOLD: ${controlNos}`,
      );
    }

    await this.costCenterRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.HOLD,
      updated_by: causer,
    });
  }

  async bulkRelease(ids: CostCenter['id'][]) {
    const causer = this.clsService.get('currentUser');
    const costCenter = await this.costCenterRepository.findByIds(ids);

    if (costCenter.length === 0) {
      throw new NotFoundException('No cost6Center found for the provided IDs.');
    }

    const alreadyReleased = costCenter.filter(
      (c) => c.status === MasterStatusEnum.ACTIVE,
    );

    if (alreadyReleased.length > 0) {
      const controlNos = alreadyReleased
        .map((c) => c.cost_center_code)
        .join(', ');
      throw new BadRequestException(
        `The following CostCenter are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = costCenter.filter(
      (c) => c.status !== MasterStatusEnum.HOLD,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.cost_center_code).join(', ');
      throw new BadRequestException(
        `The following CostCenter are not in HOLD status and cannot be RELEASED: ${controlNos}`,
      );
    }

    await this.costCenterRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: CostCenter['id'][]) {
    const costCenters = await this.costCenterRepository.findByIds(ids);
    const causer = this.clsService.get('currentUser');

    if (costCenters.length === 0) {
      throw new NotFoundException('No CostCenter found for the provided IDs.');
    }

    const alreadyCancelled = costCenters.filter(
      (c) => c.status === MasterStatusEnum.CANCELLED,
    );

    if (alreadyCancelled.length > 0) {
      const controlNos = alreadyCancelled
        .map((c) => c.cost_center_code)
        .join(', ');
      throw new BadRequestException(
        `The following CostCenter are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = costCenters.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.cost_center_code).join(', ');
      throw new BadRequestException(
        `The following CostCenter are not in ACTIVE status and cannot be CANCELLED: ${controlNos}`,
      );
    }

    await this.costCenterRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
    });
  }

  async remove(id: CostCenter['id'], causer: User) {
    const costCenter = await this.findById(id);

    if (!costCenter) throw new NotFoundException('CostCenter does not exist!');

    await this.costCenterRepository.remove(id, causer);
  }

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

  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      code: result?.cost_center_code,
      name: result?.cost_center_name,
    };
  }

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
   * Update cost center status
   *
   * Updates a cost center's status to the specified value. This method
   * provides a convenient way to change status without requiring a full
   * update request body.
   *
   * @param id - The unique identifier of the cost center
   * @param status - The new status to set
   * @param causer - The user performing the status update
   * @returns Promise<CostCenter> - The updated cost center
   *
   * @example
   * ```typescript
   * const costCenter = await costCentersService.updateStatus(7, 'Hold', user);
   * // Updates cost center 7 status to 'Hold'
   * ```
   *
   * @throws {NotFoundException} When cost center with given ID does not exist
   * @throws {BadRequestException} When status is invalid
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
