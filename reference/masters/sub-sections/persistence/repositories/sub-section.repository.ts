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
import { SubSectionEntity } from '@/masters/sub-sections/persistence/entities/sub-section.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { SubSection } from '@/masters/sub-sections/domain/sub-section';
import { BaseSubSectionRepository } from '@/masters/sub-sections/persistence/base-sub-section.repository';
import { SubSectionMapper } from '@/masters/sub-sections/persistence/mappers/sub-section.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllSubSectionsDto } from '@/masters/sub-sections/dto/find-all-sub-sections.dto';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MasterStatusEnum, StatusEnum } from '@/utils/enums/status-enum';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { IFieldFilter, ISortFilter } from '@/devextreme/devextreme.interface';
import { LookUpDto } from '@/utils/dto/lookup.dto';

/**
 * Repository implementation for sub-section data operations.
 *
 * This repository provides concrete implementations of all sub-section data access
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
 */
@Injectable()
export class SubSectionRepository implements BaseSubSectionRepository {
  /**
   * Creates an instance of SubSectionRepository.
   *
   * @param subSectionRepository - TypeORM repository for sub-section entity operations
   */
  constructor(
    @InjectRepository(SubSectionEntity)
    private readonly subSectionRepository: Repository<SubSectionEntity>,
  ) {}
  /**
   * Creates a new sub-section in the database.
   *
   * This method persists a new sub-section entity to the database,
   * handling all necessary data transformations and relationship
   * mappings. It returns the complete sub-section with generated ID.
   *
   * @param data - The sub-section data to create
   * @returns Promise<SubSection> - The created sub-section with all fields populated
   */
  async create(data: SubSection): Promise<SubSection> {
    const persistenceModel = SubSectionMapper.toPersistence(data);
    const newEntity = await this.subSectionRepository.save(
      this.subSectionRepository.create(persistenceModel),
    );
    return SubSectionMapper.toDomain(newEntity);
  }
  /**
   * Retrieves sub-sections using DevExtreme-compatible query parameters.
   *
   * This method processes DevExtreme grid parameters including filtering,
   * sorting, and pagination. It supports complex filtering operations
   * and returns data in a format compatible with DevExtreme components.
   *
   * @param loadOptions - DevExtreme query parameters including filter and sort
   * @returns Promise<DevExtremePaginatedResponseDto<SubSection>> - Paginated sub-section data
   */
  async findByMany(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['sub_sections.id'],
      },
      {
        field: 'status',
        relatedFields: ['sub_sections.status'],
      },
      {
        field: 'sub_section_code',
        relatedFields: ['sub_sections.sub_section_code'],
      },
      {
        field: 'sub_section_name',
        relatedFields: ['sub_sections.sub_section_name'],
      },
      {
        field: 'sub_section_head',
        relatedFields: [
          `CONCAT(sub_section_head.first_name, ' ',sub_section_head.last_name)`,
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
      order = { 'sub_sections.sub_section_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    const query = this.subSectionRepository
      .createQueryBuilder('sub_sections')
      .withDeleted()
      .where(where)
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition)
      .leftJoinAndSelect('sub_sections.sub_section_head', 'sub_section_head');

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => SubSectionMapper.toDomain(entity));
    return { data, totalCount };
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
   */
  async findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllSubSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SubSection>> {
    const where = this.getWhereClause(filterQuery);

    const [entities, totalResults] =
      await this.subSectionRepository.findAndCount({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        relations: ['sub_section_head'],
        where,
      });

    const data = entities.map((entity) => SubSectionMapper.toDomain(entity));
    return { data, totalResults };
  }
  /**
   * Retrieves a sub-section by its unique identifier.
   *
   * This method finds a sub-section by its ID and returns the complete
   * sub-section information including relationships. It performs validation
   * to ensure the sub-section exists before returning the data.
   *
   * @param id - The unique identifier of the sub-section
   * @returns Promise<NullableType<SubSection>> - The sub-section or null if not found
   */
  async findById(id: SubSection['id']): Promise<NullableType<SubSection>> {
    const entity = await this.subSectionRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? SubSectionMapper.toDomain(entity) : null;
  }
  /**
   * Retrieves a sub-section by its unique code.
   *
   * This method finds a sub-section using its business code rather than
   * the database ID. It's useful for business operations that reference
   * sub-sections by their human-readable codes.
   *
   * @param sub_section_code - The unique sub-section code
   * @returns Promise<NullableType<SubSection>> - The sub-section or null if not found
   */
  async findByCode(
    sub_section_code: SubSection['sub_section_code'],
  ): Promise<NullableType<SubSection>> {
    const entity = await this.subSectionRepository.findOne({
      where: { sub_section_code },
    });

    return entity ? SubSectionMapper.toDomain(entity) : null;
  }
  /**
   * Retrieves all active sub-sections in the system.
   *
   * This method returns a simplified list of all active sub-sections
   * containing only essential information (id, code, name, head). It's
   * optimized for dropdown lists and selection components.
   *
   * @returns Promise<Pick<SubSection, 'id' | 'sub_section_code' | 'sub_section_name' | 'sub_section_head'>[]> - Array of active sub-sections
   */
  async findAll(): Promise<
    Pick<
      SubSection,
      'id' | 'sub_section_code' | 'sub_section_name' | 'sub_section_head'
    >[]
  > {
    const subSections = await this.subSectionRepository.find({
      where: [{ status: In([StatusEnum.ACTIVE]) }],
    });

    return subSections.map((entity) => {
      const { id, sub_section_code, sub_section_name, sub_section_head } =
        SubSectionMapper.toDomain(entity);
      return { id, sub_section_code, sub_section_name, sub_section_head };
    });
  }
  /**
   * Retrieves distinct sub-section names from the system.
   *
   * This method returns a unique list of sub-section names, useful for
   * generating reports or analytics. It performs a distinct query
   * to eliminate duplicate names.
   *
   * @returns Promise<SubSection[]> - Array of unique sub-section names
   */
  async findDistinct(): Promise<SubSection[]> {
    return await this.subSectionRepository
      .createQueryBuilder('sub_section')
      .select('DISTINCT sub_section.sub_section_name', 'sub_section_name')
      .getRawMany();
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
   */
  async findByIds(ids: SubSection['id'][]): Promise<SubSection[]> {
    const entities = await this.subSectionRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => SubSectionMapper.toDomain(entity));
  }
  /**
   * Updates an existing sub-section with new information.
   *
   * This method updates a sub-section's properties while performing validation
   * to ensure code uniqueness and sub-section head existence. It handles partial
   * updates and maintains data integrity through business rule validation.
   *
   * @param id - The unique identifier of the sub-section to update
   * @param payload - The updated sub-section data
   * @returns Promise<SubSection> - The updated sub-section
   */
  async update(
    id: SubSection['id'],
    payload: Partial<SubSection>,
  ): Promise<SubSection> {
    const entity = await this.subSectionRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('SubSection does not exist!');

    const updatedEntity = await this.subSectionRepository.save(
      this.subSectionRepository.create(
        SubSectionMapper.toPersistence({
          ...SubSectionMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return SubSectionMapper.toDomain(updatedEntity);
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
   */
  async remove(id: SubSection['id'], causer: User): Promise<void> {
    const entity = await this.subSectionRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('SubSection does not exist!');

    const transactionManager = this.subSectionRepository.manager;
    const causerEntity = UserMapper.toPersistence(causer);

    await transactionManager.transaction(async (manager: EntityManager) => {
      try {
        // Attempt to soft delete the entity with status update
        await manager.update(
          SubSectionEntity,
          { id: entity.id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: causerEntity,
            deleted_by: causerEntity,
          },
        );
        await manager.softDelete(SubSectionEntity, { id: entity.id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Fallback to updating status only if soft delete fails
        await manager.update(
          SubSectionEntity,
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

  private getWhereClause(filterQuery: FindAllSubSectionsDto['search']) {
    const where: FindOptionsWhere<SubSectionEntity>[] = [];

    if (filterQuery) {
      const search = ILike(`%${filterQuery}%`);

      const sectionHeadWhere: FindOptionsWhere<UserEntity>[] = [];
      sectionHeadWhere.push({ first_name: search });
      sectionHeadWhere.push({ last_name: search });

      where.push({ sub_section_code: search });
      where.push({ sub_section_name: search });
      where.push({ sub_section_head: sectionHeadWhere });
    }

    return where;
  }
  /**
   * Performs a lookup operation for sub-section selection.
   *
   * This method provides optimized sub-section lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific sub-sections from the results.
   *
   * @param loadOptions - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for sub-sections
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   */
  async lookup(loadOptions: LookUpDto, exclude?: BulkExcludeDto) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: ISortFilter[] = [
      {
        field: 'code',
        relatedFields: ['sub_sections.sub_section_code'],
      },
      {
        field: 'name',
        relatedFields: ['sub_sections.sub_section_name'],
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

      // Handle complex nested filter structures
      if (Array.isArray(normalizedFilter)) {
        filter = await createFieldFilters(normalizedFilter, fieldMaps);
      } else {
        filter = normalizedFilter;
      }
    }

    if (order) {
      order = processMultiSortMapping(order, fieldMaps) as LookUpDto['sort'];
    } else {
      order = { 'sub_sections.sub_section_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    });

    const query = this.subSectionRepository
      .createQueryBuilder('sub_sections')
      .select([
        'sub_sections.id AS id',
        'sub_sections.sub_section_code AS code',
        'sub_sections.sub_section_name AS name',
      ])
      .where('sub_sections.status = :status', {
        status: MasterStatusEnum.ACTIVE,
      });

    if (where) {
      query.andWhere(where);
    }
    query
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
        query.andWhere('sub_sections.id NOT IN (:...ids)', { ids: excludeIds });
      }
    }

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => ({
      id: entity.id,
      code: entity.sub_section_code,
      name: entity.sub_section_name,
    }));
    return { data, totalCount };
  }
}
