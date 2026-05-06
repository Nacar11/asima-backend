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
import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { SubSection } from '@/sub-sections/domain/sub-section';
import { BaseSubSectionRepository } from '@/sub-sections/persistence/base-sub-section.repository';
import { SubSectionMapper } from '@/sub-sections/persistence/mappers/sub-section.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllSubSectionsDto } from '@/sub-sections/dto/find-all-sub-sections.dto';
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
import { DeepPartial } from '@/utils/types/deep-partial.type';

@Injectable()
export class SubSectionRepository implements BaseSubSectionRepository {
  constructor(
    @InjectRepository(SubSectionEntity)
    private readonly subSectionRepository: Repository<SubSectionEntity>,
  ) {}

  async create(data: SubSection): Promise<SubSection> {
    const persistenceModel = SubSectionMapper.toPersistence(data);
    const newEntity = await this.subSectionRepository.save(
      this.subSectionRepository.create(persistenceModel),
    );
    return SubSectionMapper.toDomain(newEntity);
  }

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

  async findById(id: SubSection['id']): Promise<NullableType<SubSection>> {
    const entity = await this.subSectionRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? SubSectionMapper.toDomain(entity) : null;
  }

  async findByCode(
    sub_section_code: SubSection['sub_section_code'],
  ): Promise<NullableType<SubSection>> {
    const entity = await this.subSectionRepository.findOne({
      where: { sub_section_code },
    });

    return entity ? SubSectionMapper.toDomain(entity) : null;
  }

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

  async findDistinct(): Promise<SubSection[]> {
    return await this.subSectionRepository
      .createQueryBuilder('sub_section')
      .select('DISTINCT sub_section.sub_section_name', 'sub_section_name')
      .getRawMany();
  }

  async findByIds(ids: SubSection['id'][]): Promise<SubSection[]> {
    const entities = await this.subSectionRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => SubSectionMapper.toDomain(entity));
  }

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

  async bulkUpdate(
    ids: SubSection['id'][],
    payload: DeepPartial<SubSection>,
  ): Promise<void> {
    const persistencePayload = SubSectionMapper.toPersistence(
      payload as SubSection,
    );
    await this.subSectionRepository.update(ids, persistencePayload);
  }
}
