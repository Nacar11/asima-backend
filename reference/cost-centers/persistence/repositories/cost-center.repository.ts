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
import { CostCenterEntity } from '@/cost-centers/persistence/entities/cost-center.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { CostCenter } from '@/cost-centers/domain/cost-center';
import { BaseCostCenterRepository } from '@/cost-centers/persistence/base-cost-center.repository';
import { CostCenterMapper } from '@/cost-centers/persistence/mappers/cost-center.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllCostCentersDto } from '@/cost-centers/dto/find-all-cost-centers.dto';
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { StatusEnum } from '@/utils/enums/status-enum';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { CostCenterLookupDto } from '@/cost-centers/dto/cost-center-lookup.dto';
import { IFieldFilter } from '@/devextreme/devextreme.interface';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

/**
 * Cost Center Repository
 *
 * Handles data persistence operations for cost centers including:
 * - CRUD operations with complete related entity loading
 * - Pagination and filtering for large datasets
 * - Lookup operations for UI components
 * - Soft delete operations with audit trails
 *
 * This repository was recently updated to ensure all findById operations
 * include complete related entity data (division, department, section, sub-section)
 * and user audit information (created_by, updated_by, deleted_by).
 *
 * @example
 * ```typescript
 * // Get cost center with all related data
 * const costCenter = await costCenterRepository.findById(6);
 * // Returns complete cost center with all relations loaded
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
@Injectable()
export class CostCenterRepository implements BaseCostCenterRepository {
  /**
   * Creates a new instance of CostCenterRepository
   *
   * @param costCenterRepository - TypeORM repository for cost center entities
   */
  constructor(
    @InjectRepository(CostCenterEntity)
    private readonly costCenterRepository: Repository<CostCenterEntity>,
  ) {}

  async create(data: CostCenter): Promise<CostCenter> {
    const persistenceModel = CostCenterMapper.toPersistence(data);
    const newEntity = await this.costCenterRepository.save(
      this.costCenterRepository.create(persistenceModel),
    );
    return CostCenterMapper.toDomain(newEntity);
  }

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
   * Retrieves a cost center by ID with complete related entity data
   *
   * This method was recently updated to include all necessary relations:
   * - Division, department, section, and sub-section entities
   * - User audit entities (created_by, updated_by, deleted_by)
   *
   * The relations array ensures that all related entities are loaded
   * in a single database query, providing complete cost center data.
   *
   * @param id - The unique identifier of the cost center
   * @returns Promise<NullableType<CostCenter>> - The cost center with all relations or null if not found
   *
   * @example
   * ```typescript
   * const costCenter = await costCenterRepository.findById(6);
   * // Returns complete cost center with division, department, section, sub_section, and user audit data
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

  async findDistinct(): Promise<CostCenter[]> {
    return await this.costCenterRepository
      .createQueryBuilder('cost_center')
      .select('DISTINCT cost_center.cost_center_code', 'cost_center_code')
      .getRawMany();
  }

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
