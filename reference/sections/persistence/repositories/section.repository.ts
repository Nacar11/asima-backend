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
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Section } from '@/sections/domain/section';
import { BaseSectionRepository } from '@/sections/persistence/base-section.repository';
import { SectionMapper } from '@/sections/persistence/mappers/section.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllSectionsDto } from '@/sections/dto/find-all-sections.dto';
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

@Injectable()
export class SectionRepository implements BaseSectionRepository {
  constructor(
    @InjectRepository(SectionEntity)
    private readonly sectionRepository: Repository<SectionEntity>,
  ) {}

  async create(data: Section): Promise<Section> {
    const persistenceModel = SectionMapper.toPersistence(data);
    const newEntity = await this.sectionRepository.save(
      this.sectionRepository.create(persistenceModel),
    );
    return SectionMapper.toDomain(newEntity);
  }

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

  async findById(id: Section['id']): Promise<NullableType<Section>> {
    const entity = await this.sectionRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? SectionMapper.toDomain(entity) : null;
  }

  async findByCode(
    section_code: Section['section_code'],
  ): Promise<NullableType<Section>> {
    const entity = await this.sectionRepository.findOne({
      where: { section_code },
    });

    return entity ? SectionMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Section['id'][]): Promise<Section[]> {
    const entities = await this.sectionRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => SectionMapper.toDomain(entity));
  }

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

  async findDistinct(): Promise<Section[]> {
    return await this.sectionRepository
      .createQueryBuilder('section')
      .select('DISTINCT section.section_name', 'section_name')
      .getRawMany();
  }

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

  async bulkUpdate(
    ids: Section['id'][],
    payload: DeepPartial<Section>,
  ): Promise<void> {
    const persistencePayload = SectionMapper.toPersistence(payload as Section);
    await this.sectionRepository.update(ids, persistencePayload);
  }
}
