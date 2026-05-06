import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  FindOptionsWhere,
  ILike,
  EntityManager,
  OrderByCondition,
} from 'typeorm';
import { DivisionEntity } from '@/masters/divisions/persistence/entities/division.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Division } from '@/masters/divisions/domain/division';
import { BaseDivisionRepository } from '@/masters/divisions/persistence/base-division.repository';
import { DivisionMapper } from '@/masters/divisions/persistence/mappers/division.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllDivisionsDto } from '@/masters/divisions/dto/find-all-divisions.dto';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MasterStatusEnum, StatusEnum } from '@/utils/enums/status-enum';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { IFieldFilter, ISortFilter } from '@/devextreme/devextreme.interface';

/**
 * Repository implementation for division data operations.
 *
 * This repository provides concrete implementations of all division data access
 * operations. It handles complex queries, filtering, pagination, and relationship
 * management using TypeORM.
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
 * const repository = new DivisionRepository(divisionRepository);
 * const division = await repository.create(divisionData);
 * ```
 */
@Injectable()
export class DivisionRepository implements BaseDivisionRepository {
  /**
   * Creates an instance of DivisionRepository.
   *
   * @param divisionRepository - TypeORM repository for division entities
   */
  constructor(
    @InjectRepository(DivisionEntity)
    private readonly divisionRepository: Repository<DivisionEntity>,
  ) {}

  /**
   * Creates a new division entity in the database.
   *
   * This method converts the domain model to persistence model and saves
   * it to the database. It handles the mapping between domain and entity
   * objects and returns the complete division with generated ID.
   *
   * @param data - The division domain object to create
   * @returns Promise<Division> - The created division with generated ID
   *
   * @example
   * ```typescript
   * const division = await this.create({
   *   division_code: '01',
   *   division_name: 'Engineering',
   *   division_head: user,
   *   status: 'Active'
   * });
   * // Returns: { id: 1, division_code: '01', ... }
   * ```
   */
  async create(data: Division): Promise<Division> {
    const persistenceModel = DivisionMapper.toPersistence(data);
    const newEntity = await this.divisionRepository.save(
      this.divisionRepository.create(persistenceModel),
    );
    return DivisionMapper.toDomain(newEntity);
  }

  /**
   * Retrieves divisions using DevExtreme-compatible query parameters.
   *
   * This method processes DevExtreme grid parameters including filtering,
   * sorting, and pagination. It supports complex filtering operations
   * and returns data in a format compatible with DevExtreme components.
   *
   * @param loadOptions - DevExtreme query parameters including filter and sort
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
  async findByMany(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['divisions.id'],
      },
      {
        field: 'status',
        relatedFields: ['divisions.status'],
      },
      {
        field: 'department_code',
        relatedFields: ['divisions.department_code'],
      },
      {
        field: 'department_name',
        relatedFields: ['divisions.division_name'],
      },
      {
        field: 'division_head',
        relatedFields: ['division_head.first_name', 'division_head.last_name'],
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
      filter = await createFieldFilters(normalizedFilter, fieldMaps);
    }

    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'divisions.division_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    const query = this.divisionRepository
      .createQueryBuilder('divisions')
      .leftJoinAndSelect('divisions.division_head', 'division_head')
      .where(where)
      .withDeleted()
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => DivisionMapper.toDomain(entity));
    return { data, totalCount };
  }

  /**
   * Retrieves divisions with custom pagination and filtering.
   *
   * This method provides paginated access to divisions with custom
   * filtering capabilities. It supports search functionality across
   * division fields and returns paginated results with metadata.
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
  async findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllDivisionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Division>> {
    const where = this.getWhereClause(filterQuery);

    const [entities, totalResults] = await this.divisionRepository.findAndCount(
      {
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        relations: ['division_head'],
        where,
      },
    );

    const data = entities.map((entity) => DivisionMapper.toDomain(entity));
    return { data, totalResults };
  }

  /**
   * Retrieves a division by its unique identifier.
   *
   * This method finds a division by its ID and returns the complete
   * division information including relationships. It performs validation
   * to ensure the division exists before returning the data.
   *
   * @param id - The unique identifier of the division
   * @returns Promise<NullableType<Division>> - The division or null if not found
   *
   * @example
   * ```typescript
   * const division = await this.findById(1);
   * // Returns: { id: 1, division_code: '01', division_name: 'Engineering', ... } or null
   * ```
   */
  async findById(id: Division['id']): Promise<NullableType<Division>> {
    const entity = await this.divisionRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? DivisionMapper.toDomain(entity) : null;
  }

  /**
   * Retrieves a division by its unique code.
   *
   * This method finds a division using its business code rather than
   * the database ID. It's useful for business operations that reference
   * divisions by their human-readable codes.
   *
   * @param division_code - The unique division code
   * @returns Promise<NullableType<Division>> - The division or null if not found
   *
   * @example
   * ```typescript
   * const division = await this.findByCode('01');
   * // Returns: { id: 1, division_code: '01', division_name: 'Engineering', ... } or null
   * ```
   */
  async findByCode(
    division_code: Division['division_code'],
  ): Promise<NullableType<Division>> {
    const entity = await this.divisionRepository.findOne({
      where: { division_code },
    });

    return entity ? DivisionMapper.toDomain(entity) : null;
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
  async findByIds(ids: Division['id'][]): Promise<Division[]> {
    const entities = await this.divisionRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => DivisionMapper.toDomain(entity));
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
  async findAll(): Promise<
    Pick<Division, 'id' | 'division_code' | 'division_name'>[]
  > {
    const divisions = await this.divisionRepository.find({
      where: [{ status: In([StatusEnum.ACTIVE]) }],
    });

    return divisions.map((entity) => {
      const { id, division_code, division_name } =
        DivisionMapper.toDomain(entity);
      return { id, division_code, division_name };
    });
  }

  /**
   * Retrieves distinct division names from the system.
   *
   * This method returns a unique list of division names, useful for
   * generating reports or analytics. It performs a distinct query
   * to eliminate duplicate names.
   *
   * @returns Promise<Division[]> - Array of unique division names
   *
   * @example
   * ```typescript
   * const names = await this.findDistinct();
   * // Returns: [{ division_name: 'Engineering' }, { division_name: 'Marketing' }]
   * ```
   */
  async findDistinct(): Promise<Division[]> {
    return await this.divisionRepository
      .createQueryBuilder('division')
      .select('DISTINCT division.division_name', 'division_name')
      .getRawMany();
  }

  /**
   * Updates an existing division with new information.
   *
   * This method updates a division's properties while performing validation
   * to ensure the division exists. It handles partial updates and maintains
   * data integrity through business rule validation.
   *
   * @param id - The unique identifier of the division to update
   * @param payload - The updated division data
   * @returns Promise<Division> - The updated division
   *
   * @throws {NotFoundException} When division doesn't exist
   *
   * @example
   * ```typescript
   * const updated = await this.update(1, {
   *   division_name: 'Advanced Engineering',
   *   division_head: user
   * });
   * // Returns: { id: 1, division_name: 'Advanced Engineering', ... }
   * ```
   */
  async update(
    id: Division['id'],
    payload: Partial<Division>,
  ): Promise<Division> {
    const entity = await this.divisionRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('Division does not exist!');

    const updatedEntity = await this.divisionRepository.save(
      this.divisionRepository.create(
        DivisionMapper.toPersistence({
          ...DivisionMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return DivisionMapper.toDomain(updatedEntity);
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
  async remove(id: Division['id'], causer: User): Promise<void> {
    const entity = await this.divisionRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('Division does not exist!');

    const transactionManager = this.divisionRepository.manager;
    const causerEntity = UserMapper.toPersistence(causer);

    await transactionManager.transaction(async (manager: EntityManager) => {
      try {
        // Attempt to soft delete the entity with status update
        await manager.update(
          DivisionEntity,
          { id: entity.id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: causerEntity,
            deleted_by: causerEntity,
          },
        );
        await manager.softDelete(DivisionEntity, { id: entity.id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        await manager.update(
          DivisionEntity,
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

  private getWhereClause(filterQuery: FindAllDivisionsDto['search']) {
    const where: FindOptionsWhere<DivisionEntity>[] = [];

    if (filterQuery) {
      const search = ILike(`%${filterQuery}%`);

      const divisionHeadWhere: FindOptionsWhere<UserEntity>[] = [];
      divisionHeadWhere.push({ first_name: search });
      divisionHeadWhere.push({ last_name: search });

      where.push({ division_code: search });
      where.push({ division_name: search });
      where.push({ division_head: divisionHeadWhere });
    }

    return where;
  }

  /**
   * Performs a lookup operation for division selection.
   *
   * This method provides optimized division lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific divisions from the results.
   *
   * @param loadOptions - Lookup query parameters including search criteria
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
  async lookup(loadOptions: LookUpDto, exclude?: BulkExcludeDto) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: ISortFilter[] = [
      {
        field: 'code',
        relatedFields: ['material.material_name', 'material.material_code'],
      },
    ];

    if (filter) {
      filter = await createFieldFilters(filter, fieldMaps);
    }

    if (order) {
      order = processMultiSortMapping(order, fieldMaps) as LookUpDto['sort'];
    } else {
      order = { 'divisions.division_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    });

    const query = this.divisionRepository
      .createQueryBuilder('division')
      .select([
        'division.id',
        'division.division_code',
        'division.division_name',
      ])
      .where('division.status = :status', { status: MasterStatusEnum.ACTIVE })
      .orderBy(order as OrderByCondition);

    if (where) {
      query.andWhere(where);
    }
    query.skip(skip).take(take);

    if (exclude?.exclude_ids) {
      const excludeIds =
        typeof exclude.exclude_ids === 'string'
          ? exclude.exclude_ids
              .split(',')
              .map((id) => Number(id.trim()))
              .filter((id) => !isNaN(id))
          : exclude.exclude_ids;

      if (Array.isArray(excludeIds) && excludeIds.length > 0) {
        query.andWhere('division.id NOT IN (:...ids)', { ids: excludeIds });
      }
    }

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => ({
      id: entity.id,
      code: entity.division_code,
      name: entity.division_name,
    }));
    return { data, totalCount };
  }
}
