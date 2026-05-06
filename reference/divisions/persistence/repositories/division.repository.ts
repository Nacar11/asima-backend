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
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Division } from '@/divisions/domain/division';
import { BaseDivisionRepository } from '@/divisions/persistence/base-division.repository';
import { DivisionMapper } from '@/divisions/persistence/mappers/division.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllDivisionsDto } from '@/divisions/dto/find-all-divisions.dto';
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

@Injectable()
export class DivisionRepository implements BaseDivisionRepository {
  constructor(
    @InjectRepository(DivisionEntity)
    private readonly divisionRepository: Repository<DivisionEntity>,
  ) {}

  async create(data: Division): Promise<Division> {
    const persistenceModel = DivisionMapper.toPersistence(data);
    const newEntity = await this.divisionRepository.save(
      this.divisionRepository.create(persistenceModel),
    );
    return DivisionMapper.toDomain(newEntity);
  }

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

  async findById(id: Division['id']): Promise<NullableType<Division>> {
    const entity = await this.divisionRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? DivisionMapper.toDomain(entity) : null;
  }

  async findByCode(
    division_code: Division['division_code'],
  ): Promise<NullableType<Division>> {
    const entity = await this.divisionRepository.findOne({
      where: { division_code },
    });

    return entity ? DivisionMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Division['id'][]): Promise<Division[]> {
    const entities = await this.divisionRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => DivisionMapper.toDomain(entity));
  }

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

  async findDistinct(): Promise<Division[]> {
    return await this.divisionRepository
      .createQueryBuilder('division')
      .select('DISTINCT division.division_name', 'division_name')
      .getRawMany();
  }

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

  async bulkUpdate(
    ids: Division['id'][],
    payload: DeepPartial<Division>,
  ): Promise<void> {
    const persistencePayload = DivisionMapper.toPersistence(
      payload as Division,
    );
    await this.divisionRepository.update(ids, persistencePayload);
  }
}
