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
import { DepartmentEntity } from '@/masters/departments/persistence/entities/department.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Department } from '@/masters/departments/domain/department';
import { BaseDepartmentRepository } from '@/masters/departments/persistence/base-department.repository';
import { DepartmentMapper } from '@/masters/departments/persistence/mappers/department.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllDepartmentsDto } from '@/masters/departments/dto/find-all-departments.dto';
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
 * Repository implementation for department data operations.
 *
 * This repository provides concrete implementations of all department-related
 * database operations including CRUD operations, advanced filtering, pagination,
 * and lookup functionality. It handles complex queries with joins and
 * supports both DevExtreme-compatible and standard pagination.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Create a new department
 * const department = await this.departmentRepository.create({
 *   department_code: 'IT',
 *   department_name: 'Information Technology',
 *   department_head: userEntity,
 *   status: StatusEnum.ACTIVE,
 *   created_by: causer,
 *   updated_by: causer
 * });
 * ```
 */
@Injectable()
export class DepartmentRepository implements BaseDepartmentRepository {
  /**
   * Creates an instance of DepartmentRepository.
   *
   * @param departmentRepository - TypeORM repository for DepartmentEntity
   */
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  /**
   * Creates a new department in the database.
   *
   * Converts the domain entity to persistence format, saves it to the database,
   * and returns the created department as a domain entity.
   *
   * @param data - The department data to create
   * @returns Promise<Department> - The created department as domain entity
   *
   * @example
   * ```typescript
   * const department = await this.create({
   *   department_code: 'IT',
   *   department_name: 'Information Technology',
   *   department_head: userEntity,
   *   status: StatusEnum.ACTIVE,
   *   created_by: causer,
   *   updated_by: causer
   * });
   * ```
   */
  async create(data: Department): Promise<Department> {
    const persistenceModel = DepartmentMapper.toPersistence(data);
    const newEntity = await this.departmentRepository.save(
      this.departmentRepository.create(persistenceModel),
    );
    return DepartmentMapper.toDomain(newEntity);
  }

  /**
   * Retrieves departments with DevExtreme-compatible filtering and pagination.
   *
   * This method supports advanced filtering, sorting, and pagination
   * compatible with DevExtreme DataGrid components. It provides a flexible
   * query interface for complex data operations with field mapping and
   * normalized filtering.
   *
   * @param loadOptions - DevExtreme query parameters for filtering and pagination
   * @returns Promise<DevExtremePaginatedResponseDto<Department>> - Paginated departments response
   *
   * @example
   * ```typescript
   * const result = await this.findByMany({
   *   filter: ['status', '=', 'Active'],
   *   sort: [{ selector: 'department_code', desc: false }],
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

  /**
   * Retrieves departments with standard pagination and filtering.
   *
   * This method provides a simplified pagination interface with search
   * capabilities. It's designed for standard web applications that don't
   * require DevExtreme-specific features.
   *
   * @param filterQuery - Search term to filter departments by code, name, or department head
   * @param paginationOptions - Pagination options including page and limit
   * @returns Promise<IPaginatedResult<Department>> - Paginated departments result
   *
   * @example
   * ```typescript
   * const result = await this.findAllWithPagination({
   *   filterQuery: 'IT',
   *   paginationOptions: {
   *     page: 1,
   *     limit: 20
   *   }
   * });
   * ```
   */
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

  /**
   * Retrieves a specific department by its unique identifier.
   *
   * Returns the complete department entity with all related information
   * including department head details. This method provides full details
   * for detailed views and forms.
   *
   * @param id - The unique identifier of the department
   * @returns Promise<NullableType<Department>> - The department entity or null if not found
   *
   * @example
   * ```typescript
   * const department = await this.findById(1);
   * // Returns: { id: 1, department_code: 'IT', department_name: 'Information Technology', ... } or null
   * ```
   */
  async findById(id: Department['id']): Promise<NullableType<Department>> {
    const entity = await this.departmentRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? DepartmentMapper.toDomain(entity) : null;
  }

  /**
   * Retrieves a department by its unique code.
   *
   * Searches for a department using its code (e.g., 'IT').
   * This method is useful when you have the department code but need
   * the full entity information.
   *
   * @param department_code - The unique department code
   * @returns Promise<NullableType<Department>> - The department entity or null if not found
   *
   * @example
   * ```typescript
   * const department = await this.findByCode('IT');
   * // Returns: { id: 1, department_code: 'IT', ... } or null
   * ```
   */
  async findByCode(
    department_code: Department['department_code'],
  ): Promise<NullableType<Department>> {
    const entity = await this.departmentRepository.findOne({
      where: { department_code },
    });

    return entity ? DepartmentMapper.toDomain(entity) : null;
  }

  /**
   * Retrieves multiple departments by their IDs.
   *
   * Returns an array of departments matching the provided IDs.
   * This method is useful for bulk operations and batch processing.
   *
   * @param ids - Array of department IDs to retrieve
   * @returns Promise<Department[]> - Array of department entities
   *
   * @example
   * ```typescript
   * const departments = await this.findByIds([1, 2, 3, 4, 5]);
   * // Returns: [{ id: 1, ... }, { id: 2, ... }, ...]
   * ```
   */
  async findByIds(ids: Department['id'][]): Promise<Department[]> {
    const entities = await this.departmentRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => DepartmentMapper.toDomain(entity));
  }

  /**
   * Retrieves all departments without pagination.
   *
   * Returns a simplified list of all departments with basic information
   * (id, code, name, department_head) suitable for dropdowns, lookups, and simple listings.
   * This method is optimized for performance and includes only active departments.
   *
   * @returns Promise<Pick<Department, 'id' | 'department_code' | 'department_name' | 'department_head'>[]> - Array of simplified department data
   *
   * @example
   * ```typescript
   * const departments = await this.findAll();
   * // Returns: [{ id: 1, department_code: 'IT', department_name: 'Information Technology', department_head: {...} }, ...]
   * ```
   */
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

  /**
   * Retrieves all distinct department names.
   *
   * Returns an array of unique department names from the database.
   * This method is useful for validation, reporting, and data analysis.
   *
   * @returns Promise<Department[]> - Array of department names
   *
   * @example
   * ```typescript
   * const names = await this.findDistinct();
   * // Returns: [{ department_name: 'Information Technology' }, { department_name: 'Human Resources' }, ...]
   * ```
   */
  async findDistinct(): Promise<Department[]> {
    return await this.departmentRepository
      .createQueryBuilder('department')
      .select('DISTINCT department.department_name', 'department_name')
      .getRawMany();
  }

  /**
   * Updates an existing department with new information.
   *
   * Allows partial updates to department properties. The method validates
   * that the department exists before performing the update and uses
   * the existing entity as a base for the update.
   *
   * @param id - The unique identifier of the department to update
   * @param payload - The updated department data
   * @returns Promise<Department> - The updated department entity
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * const updatedDepartment = await this.update(1, {
   *   department_name: 'Updated IT Department',
   *   status: StatusEnum.HOLD
   * });
   * ```
   */
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

  /**
   * Soft deletes a department.
   *
   * Performs a soft delete operation on the department, marking it as
   * deleted without removing it from the database. The department
   * will be hidden from normal queries but can be recovered if needed.
   * Uses a transaction to ensure data consistency.
   *
   * @param id - The unique identifier of the department to delete
   * @param causer - The user performing the deletion
   * @returns Promise<void>
   *
   * @throws {NotFoundException} When department with the specified ID doesn't exist
   *
   * @example
   * ```typescript
   * await this.remove(1, currentUser);
   * // Department is soft deleted and marked with deleted_by and deleted_at
   * ```
   */
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

  /**
   * Performs a lookup search for departments with advanced filtering.
   *
   * This method is designed for autocomplete, search suggestions, and
   * lookup operations. It supports complex filtering expressions and
   * exclusion of specific items. The response includes only essential
   * fields (id, code, name) for optimal performance.
   *
   * @param loadOptions - Lookup query parameters with filtering options
   * @param exclude - Optional exclusion parameters for bulk operations
   * @returns Promise with lookup data and total count
   *
   * @example
   * ```typescript
   * const result = await this.lookup(
   *   { searchExpr: 'department_code', searchOperation: 'contains', searchValue: 'IT' },
   *   { excludeIds: [1, 2, 3] }
   * );
   * // Returns: { data: [{ id: 4, code: 'IT', name: 'Information Technology' }], totalCount: 1 }
   * ```
   */
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

  /**
   * Builds WHERE clause for department filtering.
   *
   * This private method constructs the WHERE conditions for filtering
   * departments based on search criteria including department code,
   * name, and department head information.
   *
   * @param filterQuery - Search term to filter departments
   * @returns FindOptionsWhere<DepartmentEntity>[] - Array of WHERE conditions
   *
   * @private
   *
   * @example
   * ```typescript
   * const where = this.getWhereClause('IT');
   * // Returns: [{ department_code: ILike('%IT%') }, { department_name: ILike('%IT%') }, ...]
   * ```
   */
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
}
