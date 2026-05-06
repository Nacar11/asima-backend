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
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Department } from '@/departments/domain/department';
import { BaseDepartmentRepository } from '@/departments/persistence/base-department.repository';
import { DepartmentMapper } from '@/departments/persistence/mappers/department.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllDepartmentsDto } from '@/departments/dto/find-all-departments.dto';
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
export class DepartmentRepository implements BaseDepartmentRepository {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async create(data: Department): Promise<Department> {
    const persistenceModel = DepartmentMapper.toPersistence(data);
    const newEntity = await this.departmentRepository.save(
      this.departmentRepository.create(persistenceModel),
    );
    return DepartmentMapper.toDomain(newEntity);
  }

  async findByMany(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['departments.id'],
      },
      {
        field: 'status',
        relatedFields: ['departments.status'],
      },
      {
        field: 'department_code',
        relatedFields: ['departments.department_code'],
      },
      {
        field: 'department_name',
        relatedFields: ['departments.department_name'],
      },
      {
        field: 'department_head',
        relatedFields: [
          'department_head.first_name',
          'department_head.last_name',
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
      filter = await createFieldFilters(normalizedFilter, fieldMaps);
    }

    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'departments.department_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    const query = this.departmentRepository
      .createQueryBuilder('departments')
      .leftJoinAndSelect('departments.department_head', 'department_head')
      .where(where)
      .withDeleted()
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => DepartmentMapper.toDomain(entity));
    return { data, totalCount };
  }

  async findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllDepartmentsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Department>> {
    const where = this.getWhereClause(filterQuery);

    const [entities, totalResults] =
      await this.departmentRepository.findAndCount({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        relations: ['department_head'],
        where,
      });

    const data = entities.map((entity) => DepartmentMapper.toDomain(entity));
    return { data, totalResults };
  }

  async findById(id: Department['id']): Promise<NullableType<Department>> {
    const entity = await this.departmentRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? DepartmentMapper.toDomain(entity) : null;
  }

  async findByCode(
    department_code: Department['department_code'],
  ): Promise<NullableType<Department>> {
    const entity = await this.departmentRepository.findOne({
      where: { department_code },
    });

    return entity ? DepartmentMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Department['id'][]): Promise<Department[]> {
    const entities = await this.departmentRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => DepartmentMapper.toDomain(entity));
  }

  async findAll(): Promise<
    Pick<
      Department,
      'id' | 'department_code' | 'department_name' | 'department_head'
    >[]
  > {
    const departments = await this.departmentRepository.find({
      where: [{ status: In([StatusEnum.ACTIVE]) }],
    });

    return departments.map((entity) => {
      const { id, department_code, department_name, department_head } =
        DepartmentMapper.toDomain(entity);
      return { id, department_code, department_name, department_head };
    });
  }

  async findDistinct(): Promise<Department[]> {
    return await this.departmentRepository
      .createQueryBuilder('department')
      .select('DISTINCT department.department_name', 'department_name')
      .getRawMany();
  }

  async update(
    id: Department['id'],
    payload: Partial<Department>,
  ): Promise<Department> {
    const entity = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('Department does not exist!');

    const updatedEntity = await this.departmentRepository.save(
      this.departmentRepository.create(
        DepartmentMapper.toPersistence({
          ...DepartmentMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return DepartmentMapper.toDomain(updatedEntity);
  }

  async remove(id: Department['id'], causer: User): Promise<void> {
    const entity = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('Department does not exist!');

    const transactionManager = this.departmentRepository.manager;
    const causerEntity = UserMapper.toPersistence(causer);

    await transactionManager.transaction(async (manager: EntityManager) => {
      try {
        // Attempt to soft delete the entity with status update
        await manager.update(
          DepartmentEntity,
          { id: entity.id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: causerEntity,
            deleted_by: causerEntity,
          },
        );
        await manager.softDelete(DepartmentEntity, { id: entity.id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Fallback to updating status only if soft delete fails
        await manager.update(
          DepartmentEntity,
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

    const fieldMaps: ISortFilter[] = [
      {
        field: 'department_code',
        relatedFields: ['department.department_code'],
      },
      {
        field: 'department_name',
        relatedFields: ['department.department_name'],
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
      order = processMultiSortMapping(order, fieldMaps) as LookUpDto['sort'];
    } else {
      order = { 'department.department_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    });

    const query = this.departmentRepository
      .createQueryBuilder('department')
      .select([
        'department.id AS id',
        'department.department_code AS department_code',
        'department.department_name AS department_name',
      ])
      .where('department.status = :status', {
        status: MasterStatusEnum.ACTIVE,
      })
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
        query.andWhere('department.id NOT IN (:...ids)', { ids: excludeIds });
      }
    }

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => ({
      id: entity.id,
      code: entity.department_code,
      name: entity.department_name,
    }));
    return { data, totalCount };
  }

  private getWhereClause(filterQuery: FindAllDepartmentsDto['search']) {
    const where: FindOptionsWhere<DepartmentEntity>[] = [];

    if (filterQuery) {
      const search = ILike(`%${filterQuery}%`);

      const departmentHeadWhere: FindOptionsWhere<UserEntity>[] = [];
      departmentHeadWhere.push({ first_name: search });
      departmentHeadWhere.push({ last_name: search });

      where.push({ department_code: search });
      where.push({ department_name: search });
      where.push({ department_head: departmentHeadWhere });
    }

    return where;
  }

  async bulkUpdate(
    ids: Department['id'][],
    payload: DeepPartial<Department>,
  ): Promise<void> {
    const persistencePayload = DepartmentMapper.toPersistence(
      payload as Department,
    );
    await this.departmentRepository.update(ids, persistencePayload);
  }
}
