import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  FindOptionsWhere,
  ILike,
  EntityManager,
  OrderByCondition,
  DeepPartial,
} from 'typeorm';
import { CostCenterEntity } from '@/masters/cost-centers/persistence/entities/cost-center.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { CostCenter } from '@/masters/cost-centers/domain/cost-center';
import { BaseCostCenterRepository } from '@/masters/cost-centers/persistence/base-cost-center.repository';
import { CostCenterMapper } from '@/masters/cost-centers/persistence/mappers/cost-center.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllCostCentersDto } from '@/masters/cost-centers/dto/find-all-cost-centers.dto';
import { DepartmentEntity } from '@/masters/departments/persistence/entities/department.entity';
import { DivisionEntity } from '@/masters/divisions/persistence/entities/division.entity';
import { SectionEntity } from '@/masters/sections/persistence/entities/section.entity';
import { SubSectionEntity } from '@/masters/sub-sections/persistence/entities/sub-section.entity';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { StatusEnum } from '@/utils/enums/status-enum';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { CostCenterLookupDto } from '@/masters/cost-centers/dto/cost-center-lookup.dto';
import { IFieldFilter } from '@/devextreme/devextreme.interface';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

/**
 * Repository implementation for cost center data operations.
 *
 * This repository provides concrete implementations of all cost center data access
 * operations defined in the BaseCostCenterRepository. It handles complex queries,
 * filtering, pagination, and relationship management using TypeORM.
 *
 * The repository includes advanced features such as:
 * - DevExtreme-compatible filtering and sorting
 * - Complex relationship queries with joins
 * - Soft delete operations with transaction support
 * - Advanced lookup operations with exclusion support
 * - Status-based filtering and search capabilities
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Create a new cost center
 * const costCenter = await this.costCenterRepository.create(costCenterData);
 *
 * // Find with advanced filtering
 * const results = await this.costCenterRepository.findByMany({
 *   filter: ['status', '=', 'Active'],
 *   sort: [{ selector: 'cost_center_code', desc: false }]
 * });
 * ```
 */
@Injectable()
export class CostCenterRepository implements BaseCostCenterRepository {
  /**
   * Creates an instance of CostCenterRepository.
   *
   * @param costCenterRepository - TypeORM repository for CostCenterEntity
   */
  constructor(
    @InjectRepository(CostCenterEntity)
    private readonly costCenterRepository: Repository<CostCenterEntity>,
  ) {}

  /**
   * Creates a new cost center in the database.
   *
   * Converts the domain entity to persistence format, saves it to the database,
   * and returns the created cost center as a domain entity.
   *
   * @param data - Cost center data to create
   * @returns Promise<CostCenter> - The created cost center entity
   *
   * @example
   * ```typescript
   * const costCenter = await this.create({
   *   cost_center_code: '01010101',
   *   division: divisionEntity,
   *   department: departmentEntity,
   *   section: sectionEntity,
   *   sub_section: subSectionEntity,
   *   status: StatusEnum.ACTIVE,
   *   created_by: causer,
   *   updated_by: causer
   * });
   * ```
   */
  async create(data: CostCenter): Promise<CostCenter> {
    const persistenceModel = CostCenterMapper.toPersistence(data);
    const newEntity = await this.costCenterRepository.save(
      this.costCenterRepository.create(persistenceModel),
    );
    return CostCenterMapper.toDomain(newEntity);
  }

  /**
   * Retrieves cost centers with DevExtreme-compatible filtering and pagination.
   *
   * Supports complex filtering across organizational relationships and provides
   * advanced sorting capabilities. Includes field mapping for proper query construction.
   * Handles complex nested filter structures and converts exact matches to contains
   * for better text search functionality.
   *
   * @param loadOptions - DevExtreme query parameters for filtering and pagination
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
  async findByMany(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['cost_centers.id::TEXT'],
      },
      {
        field: 'status',
        relatedFields: ['cost_centers.status'],
      },
      {
        field: 'cost_center_code',
        relatedFields: ['cost_centers.cost_center_code'],
      },
      {
        field: 'division',
        relatedFields: [
          'division.division_code',
          'LOWER(division.division_name)',
          'LOWER(division.division_code)',
        ],
      },
      {
        field: 'department',
        relatedFields: [
          'department.department_name',
          'department.department_code',
          'LOWER(department.department_name)',
          'LOWER(department.department_code)',
        ],
      },
      {
        field: 'section',
        relatedFields: [
          'section.section_name',
          'LOWER(section.section_name)',
          'LOWER(section.section_code)',
        ],
      },
      {
        field: 'sub_section',
        relatedFields: [
          'sub_section.sub_section_name',
          'sub_section.sub_section_code',
          'LOWER(sub_section.sub_section_name)',
          'LOWER(sub_section.sub_section_code)',
        ],
      },
    ];

    if (filter !== undefined) {
      let normalizedFilter: any = filter;
      if (typeof normalizedFilter === 'string') {
        try {
          normalizedFilter = JSON.parse(normalizedFilter);
        } catch {
          normalizedFilter = filter;
        }
      }
      // Convert exact matches to contains for text fields
      normalizedFilter = this.convertExactToContains(normalizedFilter);

      // Handle complex nested filter structures
      if (Array.isArray(normalizedFilter)) {
        filter = await createFieldFilters(normalizedFilter, fieldMaps);
      } else {
        filter = normalizedFilter;
      }
    }

    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'cost_centers.cost_center_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    const query = this.costCenterRepository
      .createQueryBuilder('cost_centers')
      .withDeleted()
      .where(where)
      .withDeleted()
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition)
      .leftJoinAndSelect('cost_centers.division', 'division')
      .leftJoinAndSelect('cost_centers.department', 'department')
      .leftJoinAndSelect('cost_centers.section', 'section')
      .leftJoinAndSelect('cost_centers.sub_section', 'sub_section');

    console.log('query', query.getQuery());

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => CostCenterMapper.toDomain(entity));
    return { data, totalCount };
  }

  /**
   * Converts exact matches to contains for text fields in filters.
   *
   * This private method processes filter arrays to convert exact matches (=)
   * to contains operations for text fields, improving search functionality
   * by allowing partial matches on organizational structure fields.
   *
   * @param filter - The filter array to process
   * @returns any - The processed filter with converted operators
   *
   * @private
   *
   * @example
   * ```typescript
   * const processedFilter = this.convertExactToContains([
   *   ['division', '=', 'IT']
   * ]);
   * // Returns: [['division', 'contains', 'IT']]
   * ```
   */
  private convertExactToContains(filter: any): any {
    if (!Array.isArray(filter)) {
      return filter;
    }

    const textFields = [
      'division',
      'department',
      'section',
      'sub_section',
      'cost_center_code',
    ];

    return filter.map((item) => {
      if (Array.isArray(item)) {
        // Check if this is a condition array [field, operator, value]
        if (
          item.length === 3 &&
          typeof item[0] === 'string' &&
          typeof item[1] === 'string'
        ) {
          const [field, operator, value] = item;

          // Convert "=" to "contains" for text fields
          if (operator === '=' && textFields.includes(field)) {
            return [field, 'contains', value];
          }
        }

        // Recursively process nested arrays
        return this.convertExactToContains(item);
      }

      return item;
    });
  }

  /**
   * Retrieves cost centers with standard pagination and filtering.
   *
   * This method provides a simplified pagination interface with search
   * capabilities and status filtering. It's designed for standard web
   * applications that don't require DevExtreme-specific features.
   * Supports filtering across all organizational relationships.
   *
   * @param filterQuery - Search term to filter cost centers by code, name, or organizational structure
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
  async findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllCostCentersDto['search'];
    paginationOptions: IPaginationOptions & { status: StatusEnum[] | 'all' };
  }): Promise<IPaginatedResult<CostCenter>> {
    const where = this.getWhereClause(filterQuery, paginationOptions.status);

    const [entities, totalResults] =
      await this.costCenterRepository.findAndCount({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        relations: ['division', 'department', 'section', 'sub_section'],
        where,
      });

    const data = entities.map((entity) => CostCenterMapper.toDomain(entity));
    return { data, totalResults };
  }

  /**
   * Retrieves a cost center by its unique identifier.
   *
   * Returns the complete cost center entity with all related organizational
   * structure information (division, department, section, sub-section) and
   * audit fields. This method provides full details for detailed views and forms.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise<NullableType<CostCenter>> - The cost center entity or null if not found
   *
   * @example
   * ```typescript
   * const costCenter = await this.findById(1);
   * // Returns: { id: 1, cost_center_code: '01010101', division: {...}, department: {...}, ... } or null
   * ```
   */
  async findById(id: number): Promise<NullableType<CostCenter>> {
    const entity = await this.costCenterRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: [
        'division',
        'department',
        'section',
        'sub_section',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    if (!entity) return null;

    return entity ? CostCenterMapper.toDomain(entity) : null;
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
  async findByIdOrFail(id: CostCenter['id']): Promise<CostCenter> {
    const entity = await this.costCenterRepository.findOne({
      where: { id },
      relations: [
        'division',
        'department',
        'section',
        'sub_section',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    if (!entity) throw new NotFoundException('Cost Center does not exists!');

    return CostCenterMapper.toDomain(entity);
  }

  /**
   * Retrieves a cost center by its unique code.
   *
   * Searches for a cost center using its generated code (e.g., '01010101').
   * This method is useful when you have the cost center code but need
   * the full entity information with all relationships.
   *
   * @param cost_center_code - The unique cost center code
   * @returns Promise<NullableType<CostCenter>> - The cost center entity or null if not found
   *
   * @example
   * ```typescript
   * const costCenter = await this.findByCode('01010101');
   * // Returns: { id: 1, cost_center_code: '01010101', ... } or null
   * ```
   */
  async findByCode(
    cost_center_code: CostCenter['cost_center_code'],
  ): Promise<NullableType<CostCenter>> {
    const entity = await this.costCenterRepository.findOne({
      where: { cost_center_code },
      relations: [
        'division',
        'department',
        'section',
        'sub_section',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    return entity ? CostCenterMapper.toDomain(entity) : null;
  }

  /**
   * Retrieves multiple cost centers by their IDs.
   *
   * Returns an array of cost centers matching the provided IDs.
   * This method is useful for bulk operations and batch processing.
   * Includes all relationships for complete cost center information.
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
  async findByIds(ids: CostCenter['id'][]): Promise<CostCenter[]> {
    const entities = await this.costCenterRepository.find({
      where: { id: In(ids) },
      relations: [
        'division',
        'department',
        'section',
        'sub_section',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    return entities.map((entity) => CostCenterMapper.toDomain(entity));
  }

  /**
   * Retrieves all cost centers without pagination.
   *
   * Returns a simplified list of all cost centers with basic information
   * (id, code, name) suitable for dropdowns, lookups, and simple listings.
   * This method is optimized for performance and includes only active cost centers.
   *
   * @returns Promise<Pick<CostCenter, 'id' | 'cost_center_code' | 'cost_center_name'>[]> - Array of simplified cost center data
   *
   * @example
   * ```typescript
   * const costCenters = await this.findAll();
   * // Returns: [{ id: 1, cost_center_code: '01010101', cost_center_name: '01010101 / Backend' }, ...]
   * ```
   */
  async findAll(): Promise<
    Pick<CostCenter, 'id' | 'cost_center_code' | 'cost_center_name'>[]
  > {
    const costCenters = await this.costCenterRepository.find({
      where: [{ status: In([StatusEnum.ACTIVE]) }],
    });

    return costCenters.map((entity) => {
      const { id, cost_center_code, cost_center_name } =
        CostCenterMapper.toDomain(entity);
      return { id, cost_center_code, cost_center_name };
    });
  }

  /**
   * Retrieves all distinct cost center codes.
   *
   * Returns an array of unique cost center codes from the database.
   * This method is useful for validation, reporting, and data analysis.
   *
   * @returns Promise<CostCenter[]> - Array of unique cost center codes
   *
   * @example
   * ```typescript
   * const codes = await this.findDistinct();
   * // Returns: [{ cost_center_code: '01010101' }, { cost_center_code: '01010102' }, ...]
   * ```
   */
  async findDistinct(): Promise<CostCenter[]> {
    return await this.costCenterRepository
      .createQueryBuilder('cost_center')
      .select('DISTINCT cost_center.cost_center_code', 'cost_center_code')
      .getRawMany();
  }

  /**
   * Updates an existing cost center with new information.
   *
   * Allows partial updates to cost center properties. The method validates
   * that the cost center exists before performing the update and uses
   * the existing entity as a base for the update.
   *
   * @param id - The unique identifier of the cost center to update
   * @param payload - The updated cost center data
   * @returns Promise<CostCenter> - The updated cost center entity
   *
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const updatedCostCenter = await this.update(1, {
   *   remarks: 'Updated description',
   *   status: StatusEnum.HOLD
   * });
   * ```
   */
  async update(
    id: CostCenter['id'],
    payload: Partial<CostCenter>,
  ): Promise<CostCenter> {
    const entity = await this.costCenterRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('CostCenter does not exist!');

    const updatedEntity = await this.costCenterRepository.save(
      this.costCenterRepository.create(
        CostCenterMapper.toPersistence({
          ...CostCenterMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return CostCenterMapper.toDomain(updatedEntity);
  }

  /**
   * Soft deletes a cost center with transaction support.
   *
   * Performs a soft delete operation with status update and audit tracking.
   * Uses database transactions to ensure data consistency.
   *
   * @param id - The unique identifier of the cost center to delete
   * @param causer - The user performing the deletion
   * @returns Promise<void>
   * @throws {NotFoundException} When cost center with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * await this.remove(1, currentUser);
   * // Cost center is soft deleted and marked with deleted_by and deleted_at
   * ```
   */
  async remove(id: CostCenter['id'], causer: User): Promise<void> {
    const entity = await this.costCenterRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('CostCenter does not exist!');

    const transactionManager = this.costCenterRepository.manager;
    const causerEntity = UserMapper.toPersistence(causer);

    await transactionManager.transaction(async (manager: EntityManager) => {
      try {
        // Attempt to soft delete the entity with status update
        await manager.update(
          CostCenterEntity,
          { id: entity.id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: causerEntity,
            deleted_by: causerEntity,
          },
        );
        await manager.softDelete(CostCenterEntity, { id: entity.id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Fallback to updating status only if soft delete fails
        await manager.update(
          CostCenterEntity,
          { id: entity.id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: causerEntity,
            deleted_by: causerEntity,
          },
        );
      }
    });
  }

  /**
   * Performs a lookup search for cost centers with advanced filtering.
   *
   * Supports exclusion of specific items and complex filtering expressions.
   * Optimized for autocomplete and search suggestions.
   *
   * @param loadOptions - Lookup query parameters with filtering options
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
  async lookup(loadOptions: LookUpDto, exclude?: BulkExcludeDto) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: IFieldFilter[] = [
      {
        field: 'code',
        relatedFields: [
          'cc.cost_center_code',
          'division.division_name',
          'department.department_name',
          'section.section_name',
          'sub_section.sub_section_name',
        ],
      },
    ];

    if (filter) {
      filter = (await createFieldFilters(
        filter,
        fieldMaps,
      )) as CostCenterLookupDto['filter'];
    }

    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as CostCenterLookupDto['sort'];
    } else {
      order = { 'cc.cost_center_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    });

    const queryBuilder = this.costCenterRepository
      .createQueryBuilder('cc')
      .leftJoinAndSelect('cc.division', 'division')
      .leftJoinAndSelect('cc.department', 'department')
      .leftJoinAndSelect('cc.section', 'section')
      .leftJoinAndSelect('cc.sub_section', 'sub_section')
      .where('cc.status = :status', { status: StatusEnum.ACTIVE })
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);

    if (exclude?.exclude_ids) {
      const excludeIds =
        typeof exclude.exclude_ids === 'string'
          ? exclude.exclude_ids
              .split(',')
              .map((id) => Number(id.trim()))
              .filter((id) => !isNaN(id))
          : exclude.exclude_ids;

      if (Array.isArray(excludeIds) && excludeIds.length > 0) {
        queryBuilder.andWhere('cc.id NOT IN (:...ids)', { ids: excludeIds });
      }
    }

    if (where) {
      queryBuilder.andWhere(where);
    }

    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    const data = entities.map((entity) => {
      const costCenter = CostCenterMapper.toDomain(entity);
      return {
        id: entity.id,
        code: entity.cost_center_code,
        name: costCenter.cost_center_name || entity.cost_center_code,
      };
    });

    return { data, totalCount };
  }

  /**
   * Builds WHERE clause for cost center filtering.
   *
   * This private method constructs the WHERE conditions for filtering
   * cost centers based on search criteria and status filters. It supports
   * searching across all organizational relationships and handles
   * complex status filtering scenarios.
   *
   * @param filterQuery - Search term to filter cost centers
   * @param statusQuery - Status filter (array of statuses or 'all')
   * @returns FindOptionsWhere<CostCenterEntity>[] - Array of WHERE conditions
   *
   * @private
   *
   * @example
   * ```typescript
   * const where = this.getWhereClause('Backend', [StatusEnum.ACTIVE]);
   * // Returns: [{ status: In([StatusEnum.ACTIVE]), cost_center_code: ILike('%Backend%'), ... }]
   * ```
   */
  private getWhereClause(
    filterQuery: FindAllCostCentersDto['search'],
    statusQuery: StatusEnum[] | 'all',
  ) {
    const where: FindOptionsWhere<CostCenterEntity>[] = [];

    const statuses: StatusEnum[] =
      statusQuery == 'all'
        ? [StatusEnum.ACTIVE, StatusEnum.CANCELLED]
        : Array.isArray(statusQuery)
          ? statusQuery
          : [statusQuery];

    where.push({ status: In(statuses) });

    if (filterQuery) {
      const division: FindOptionsWhere<DivisionEntity>[] = [];
      const department: FindOptionsWhere<DepartmentEntity>[] = [];
      const section: FindOptionsWhere<SectionEntity>[] = [];
      const sub_section: FindOptionsWhere<SubSectionEntity>[] = [];

      const search = ILike(`%${filterQuery}%`);

      division.push({ division_code: search });
      division.push({ division_name: search });

      department.push({ department_code: search });
      department.push({ department_name: search });

      section.push({ section_code: search });
      section.push({ section_name: search });

      sub_section.push({ sub_section_code: search });
      sub_section.push({ sub_section_name: search });

      where.push({ cost_center_code: search });
      where.push({ division });
      where.push({ department });
      where.push({ section });
      where.push({ sub_section });
      where.push({ remarks: search });
    }

    return where;
  }

  async bulkUpdate(
    ids: CostCenter['id'][],
    payload: DeepPartial<CostCenter>,
  ): Promise<void> {
    const persistencePayload = CostCenterMapper.toPersistence(
      payload as CostCenter,
    );
    await this.costCenterRepository.update(ids, persistencePayload);
  }
}
