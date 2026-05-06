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
import { SectionEntity } from '@/masters/sections/persistence/entities/section.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Section } from '@/masters/sections/domain/section';
import { BaseSectionRepository } from '@/masters/sections/persistence/base-section.repository';
import { SectionMapper } from '@/masters/sections/persistence/mappers/section.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllSectionsDto } from '@/masters/sections/dto/find-all-sections.dto';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MasterStatusEnum, StatusEnum } from '@/utils/enums/status-enum';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { ISortFilter, IFieldFilter } from '@/devextreme/devextreme.interface';

/**
 * Repository implementation for section data operations.
 *
 * This repository provides concrete implementations of all section data access
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
 * const repository = new SectionRepository(sectionRepository);
 * const section = await repository.create(sectionData);
 * ```
 */
@Injectable()
export class SectionRepository implements BaseSectionRepository {
  /**
   * Creates an instance of SectionRepository.
   *
   * @param sectionRepository - TypeORM repository for section entities
   */
  constructor(
    @InjectRepository(SectionEntity)
    private readonly sectionRepository: Repository<SectionEntity>,
  ) {}

  /**
   * Creates a new section entity in the database.
   *
   * This method converts the domain model to persistence model and saves
   * it to the database. It handles the mapping between domain and entity
   * objects and returns the complete section with generated ID.
   *
   * @param data - The section domain object to create
   * @returns Promise<Section> - The created section with generated ID
   *
   * @example
   * ```typescript
   * const section = await this.create({
   *   section_code: '01',
   *   section_name: 'Engineering',
   *   section_head: user,
   *   status: 'Active'
   * });
   * // Returns: { id: 1, section_code: '01', ... }
   * ```
   */
  async create(data: Section): Promise<Section> {
    const persistenceModel = SectionMapper.toPersistence(data);
    const newEntity = await this.sectionRepository.save(
      this.sectionRepository.create(persistenceModel),
    );
    return SectionMapper.toDomain(newEntity);
  }

  /**
   * Retrieves sections using DevExtreme-compatible query parameters.
   *
   * This method processes DevExtreme grid parameters including filtering,
   * sorting, and pagination. It supports complex filtering operations
   * and returns data in a format compatible with DevExtreme components.
   *
   * @param loadOptions - DevExtreme query parameters including filter and sort
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
  async findByMany(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['sections.id'],
      },
      {
        field: 'status',
        relatedFields: ['sections.status'],
      },
      {
        field: 'section_code',
        relatedFields: ['sections.section_code'],
      },
      {
        field: 'section_name',
        relatedFields: ['sections.section_name'],
      },
      {
        field: 'section_head',
        relatedFields: ['section_head.first_name', 'section_head.last_name'],
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
      order = { 'sections.section_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    const query = this.sectionRepository
      .createQueryBuilder('sections')
      .leftJoinAndSelect('sections.section_head', 'section_head')
      .where(where)
      .withDeleted()
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => SectionMapper.toDomain(entity));
    return { data, totalCount };
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
  async findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Section>> {
    const where = this.getWhereClause(filterQuery);

    const [entities, totalResults] = await this.sectionRepository.findAndCount({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      relations: ['section_head'],
      where,
    });

    const data = entities.map((entity) => SectionMapper.toDomain(entity));
    return { data, totalResults };
  }

  /**
   * Retrieves a section by its unique identifier.
   *
   * This method finds a section by its ID and returns the complete
   * section information including relationships. It performs validation
   * to ensure the section exists before returning the data.
   *
   * @param id - The unique identifier of the section
   * @returns Promise<NullableType<Section>> - The section or null if not found
   *
   * @example
   * ```typescript
   * const section = await this.findById(1);
   * // Returns: { id: 1, section_code: '01', section_name: 'Engineering', ... } or null
   * ```
   */
  async findById(id: Section['id']): Promise<NullableType<Section>> {
    const entity = await this.sectionRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? SectionMapper.toDomain(entity) : null;
  }

  /**
   * Retrieves a section by its unique code.
   *
   * This method finds a section using its business code rather than
   * the database ID. It's useful for business operations that reference
   * sections by their human-readable codes.
   *
   * @param section_code - The unique section code
   * @returns Promise<NullableType<Section>> - The section or null if not found
   *
   * @example
   * ```typescript
   * const section = await this.findByCode('01');
   * // Returns: { id: 1, section_code: '01', section_name: 'Engineering', ... } or null
   * ```
   */
  async findByCode(
    section_code: Section['section_code'],
  ): Promise<NullableType<Section>> {
    const entity = await this.sectionRepository.findOne({
      where: { section_code },
    });

    return entity ? SectionMapper.toDomain(entity) : null;
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
  async findByIds(ids: Section['id'][]): Promise<Section[]> {
    const entities = await this.sectionRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => SectionMapper.toDomain(entity));
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
  async findAll(): Promise<
    Pick<Section, 'id' | 'section_code' | 'section_name'>[]
  > {
    const sections = await this.sectionRepository.find({
      where: [{ status: In([StatusEnum.ACTIVE]) }],
    });

    return sections.map((entity) => {
      const { id, section_code, section_name } = SectionMapper.toDomain(entity);
      return { id, section_code, section_name };
    });
  }

  /**
   * Retrieves distinct section names from the system.
   *
   * This method returns a unique list of section names, useful for
   * generating reports or analytics. It performs a distinct query
   * to eliminate duplicate names.
   *
   * @returns Promise<Section[]> - Array of unique section names
   *
   * @example
   * ```typescript
   * const names = await this.findDistinct();
   * // Returns: [{ section_name: 'Engineering' }, { section_name: 'Marketing' }]
   * ```
   */
  async findDistinct(): Promise<Section[]> {
    return await this.sectionRepository
      .createQueryBuilder('section')
      .select('DISTINCT section.section_name', 'section_name')
      .getRawMany();
  }

  /**
   * Updates an existing section with new information.
   *
   * This method updates a section's properties while performing validation
   * to ensure the section exists. It handles partial updates and maintains
   * data integrity through business rule validation.
   *
   * @param id - The unique identifier of the section to update
   * @param payload - The updated section data
   * @returns Promise<Section> - The updated section
   *
   * @throws {NotFoundException} When section doesn't exist
   *
   * @example
   * ```typescript
   * const updated = await this.update(1, {
   *   section_name: 'Advanced Engineering',
   *   section_head: user
   * });
   * // Returns: { id: 1, section_name: 'Advanced Engineering', ... }
   * ```
   */
  async update(id: Section['id'], payload: Partial<Section>): Promise<Section> {
    const entity = await this.sectionRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('Section does not exist!');

    const updatedEntity = await this.sectionRepository.save(
      this.sectionRepository.create(
        SectionMapper.toPersistence({
          ...SectionMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return SectionMapper.toDomain(updatedEntity);
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
  async remove(id: Section['id'], causer: User): Promise<void> {
    const entity = await this.sectionRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('Section does not exist!');

    const transactionManager = this.sectionRepository.manager;
    const causerEntity = UserMapper.toPersistence(causer);

    await transactionManager.transaction(async (manager: EntityManager) => {
      try {
        // Attempt to soft delete the entity with status update
        await manager.update(
          SectionEntity,
          { id: entity.id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: causerEntity,
            deleted_by: causerEntity,
          },
        );
        await manager.softDelete(SectionEntity, { id: entity.id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Fallback to updating status only if soft delete fails
        await manager.update(
          SectionEntity,
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
   * Builds where clause for section filtering.
   *
   * This private method constructs the where clause for filtering sections
   * based on search criteria. It supports searching across section fields
   * and section head information.
   *
   * @param filterQuery - Search criteria for filtering sections
   * @returns FindOptionsWhere<SectionEntity>[] - Array of where conditions
   *
   * @example
   * ```typescript
   * const where = this.getWhereClause('Engineering');
   * // Returns: [{ section_name: ILike('%Engineering%') }, ...]
   * ```
   */
  private getWhereClause(filterQuery: FindAllSectionsDto['search']) {
    const where: FindOptionsWhere<SectionEntity>[] = [];

    if (filterQuery) {
      const search = ILike(`%${filterQuery}%`);

      const sectionHeadWhere: FindOptionsWhere<UserEntity>[] = [];
      sectionHeadWhere.push({ first_name: search });
      sectionHeadWhere.push({ last_name: search });

      where.push({ section_code: search });
      where.push({ section_name: search });
      where.push({ section_head: sectionHeadWhere });
    }

    return where;
  }

  /**
   * Performs a lookup operation for section selection.
   *
   * This method provides optimized section lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific sections from the results.
   *
   * @param loadOptions - Lookup query parameters including search criteria
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
  async lookup(loadOptions: LookUpDto, exclude?: BulkExcludeDto) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: ISortFilter[] = [
      {
        field: 'section_code',
        relatedFields: ['sections.section_code', 'sections.section_name'],
      },
    ];

    if (filter) {
      filter = await createFieldFilters(filter, fieldMaps);
    }

    if (order) {
      order = processMultiSortMapping(order, fieldMaps) as LookUpDto['sort'];
    } else {
      order = { 'sections.section_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    });

    const query = this.sectionRepository
      .createQueryBuilder('sections')
      .where('sections.status = :status', { status: MasterStatusEnum.ACTIVE });

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
        query.andWhere('material.id NOT IN (:...ids)', { ids: excludeIds });
      }
    }

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => ({
      id: entity.id,
      code: entity.section_code,
      name: entity.section_name,
    }));
    return { data, totalCount };
  }
}
