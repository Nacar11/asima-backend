import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  Repository,
  In,
  FindOneOptions,
  ILike,
  EntityManager,
  OrderByCondition,
  DeepPartial,
} from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { QueryUserDto } from '@/users/dto/query-user.dto';
import { User } from '@/users/domain/user';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { StatusEnum } from '@/users/users.enum';
import { GetUserGroupsFromAssignmentsMapper } from '../mappers/get-user-groups-from-assignments.mapper';
import { GetUserPermissionsMapper } from '../mappers/get-user-permissions.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { UserLookupDto } from '@/users/dto/user-lookup.dto';

@Injectable()
export class UsersRepository implements BaseUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(data: User): Promise<User> {
    const persistenceModel = UserMapper.toPersistence(data);

    const newEntity = await this.usersRepository.save(
      this.usersRepository.create(persistenceModel),
    );
    return UserMapper.toDomain(newEntity);
  }

  async findManyBy(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps = [
      { field: 'status', relatedFields: ['users.status'] },
      {
        field: 'user_id',
        relatedFields: ['users.user_id::TEXT'],
      },
      {
        field: 'email',
        relatedFields: ['users.email::TEXT'],
      },
      {
        field: 'cost_center',
        relatedFields: [
          'cost_center.cost_center_code',
          'sub_section.sub_section_name',
          'section.section_name',
          'department.department_name',
          'division.division_name',
        ],
      },
      {
        field: 'first_name',
        relatedFields: ['users.first_name::TEXT'],
      },
      {
        field: 'last_name',
        relatedFields: ['users.last_name::TEXT'],
      },
      {
        field: 'middle_name',
        relatedFields: ['users.middle_name::TEXT'],
      },
      {
        field: 'user_id_or_email',
        relatedFields: [
          'users.user_id::TEXT',
          'users.email::TEXT',
          'users.first_name::TEXT',
          'users.last_name::TEXT',
          'users.middle_name::TEXT',
        ],
      },
    ];

    if (filter) {
      filter = await createFieldFilters(filter, fieldMaps);
    }

    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'users.user_id': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    const query = this.usersRepository
      .createQueryBuilder('users')
      .select([
        'users.id',
        'users.user_id',
        'users.first_name',
        'users.middle_name',
        'users.last_name',
        'users.suffix',
        'users.email',
        'users.phone',
        'users.email_verified',
        'users.phone_verified',
        'users.default_address_id',
        'users.preferred_currency_id',
        'users.system_admin',
        'users.image',
        'users.status',
        'users.created_at',
        'users.updated_at',
        'users.deleted_at',
      ])
      .leftJoinAndSelect('users.cost_center', 'cost_center')
      .leftJoinAndSelect('cost_center.division', 'division')
      .leftJoinAndSelect('cost_center.department', 'department')
      .leftJoinAndSelect('cost_center.section', 'section')
      .leftJoinAndSelect('cost_center.sub_section', 'sub_section')
      .leftJoinAndSelect('users.details', 'details')
      .leftJoinAndSelect('users.default_address', 'default_address')
      .leftJoin('users.created_by', 'created_by')
      .addSelect([
        'created_by.id',
        'created_by.first_name',
        'created_by.last_name',
      ])
      .leftJoin('users.updated_by', 'updated_by')
      .addSelect([
        'updated_by.id',
        'updated_by.first_name',
        'updated_by.last_name',
      ])
      .leftJoin('users.deleted_by', 'deleted_by')
      .addSelect([
        'deleted_by.id',
        'deleted_by.first_name',
        'deleted_by.last_name',
      ])
      .where(where)
      .withDeleted()
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => UserMapper.toDomain(entity));
    return { data, totalCount };
  }

  async findOneBy(conditions: Record<string, any>): Promise<User> {
    const entity = await this.usersRepository.findOne({
      where: conditions,
      select: {
        id: true,
        user_id: true,
        device_pin: true,
        first_name: true,
        middle_name: true,
        last_name: true,
      },
    });

    if (!entity) throw new NotFoundException('User not found!');

    return UserMapper.toDomain(entity);
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    // Use QueryBuilder to properly filter soft-deleted assignments
    const entity = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.cost_center', 'cost_center')
      .leftJoinAndSelect('cost_center.division', 'division')
      .leftJoinAndSelect('cost_center.department', 'department')
      .leftJoinAndSelect('cost_center.section', 'section')
      .leftJoinAndSelect('cost_center.sub_section', 'sub_section')
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.details', 'details')
      .leftJoinAndSelect('user.created_by', 'created_by')
      .leftJoinAndSelect('user.updated_by', 'updated_by')
      .leftJoinAndSelect('user.deleted_by', 'deleted_by')
      .leftJoinAndSelect('user.default_address', 'default_address')
      // Filter assignments to only include Active, non-deleted ones
      .leftJoinAndSelect(
        'user.assignments',
        'assignments',
        "assignments.status = 'Active' AND assignments.deleted_at IS NULL",
      )
      .leftJoinAndSelect('assignments.group', 'group')
      .where('user.id = :id', { id: Number(id) })
      .withDeleted()
      .getOne();

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByUserId(id: User['user_id']): Promise<NullableType<User>> {
    const relations = this.getRelationOptions();

    if (!id) {
      return null;
    }

    const entity = await this.usersRepository.findOne({
      where: [{ user_id: id }],
      relations,
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const entities = await this.usersRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;

    // Use QueryBuilder to properly filter soft-deleted assignments
    const entity = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.cost_center', 'cost_center')
      .leftJoinAndSelect('cost_center.division', 'division')
      .leftJoinAndSelect('cost_center.department', 'department')
      .leftJoinAndSelect('cost_center.section', 'section')
      .leftJoinAndSelect('cost_center.sub_section', 'sub_section')
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.details', 'details')
      .leftJoinAndSelect('user.created_by', 'created_by')
      .leftJoinAndSelect('user.updated_by', 'updated_by')
      .leftJoinAndSelect('user.deleted_by', 'deleted_by')
      .leftJoinAndSelect('user.default_address', 'default_address')
      // Filter assignments to only include Active, non-deleted ones
      .leftJoinAndSelect(
        'user.assignments',
        'assignments',
        "assignments.status = 'Active' AND assignments.deleted_at IS NULL",
      )
      .leftJoinAndSelect('assignments.group', 'group')
      .where('user.email = :email', { email })
      .withDeleted()
      .getOne();

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIdWithCredentials(id: User['id']): Promise<NullableType<User>> {
    if (!id) return null;

    const entity = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.password', 'user.salt'])
      .leftJoinAndSelect('user.cost_center', 'cost_center')
      .leftJoinAndSelect('cost_center.division', 'division')
      .leftJoinAndSelect('cost_center.department', 'department')
      .leftJoinAndSelect('cost_center.section', 'section')
      .leftJoinAndSelect('cost_center.sub_section', 'sub_section')
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.details', 'details')
      .leftJoinAndSelect('user.created_by', 'created_by')
      .leftJoinAndSelect('user.updated_by', 'updated_by')
      .leftJoinAndSelect('user.deleted_by', 'deleted_by')
      .leftJoinAndSelect('user.default_address', 'default_address')
      .leftJoinAndSelect(
        'user.assignments',
        'assignments',
        "assignments.status = 'Active' AND assignments.deleted_at IS NULL",
      )
      .leftJoinAndSelect('assignments.group', 'group')
      .where('user.id = :id', { id: Number(id) })
      .withDeleted()
      .getOne();

    if (!entity) return null;

    const user = UserMapper.toDomain(entity);
    user.password = entity.password ?? undefined;
    user.salt = entity.salt ?? undefined;

    return user;
  }

  async findByEmailWithCredentials(
    email: User['email'],
  ): Promise<NullableType<User>> {
    if (!email) return null;

    // Use QueryBuilder to properly filter soft-deleted assignments
    const entity = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.password', 'user.salt'])
      .leftJoinAndSelect('user.cost_center', 'cost_center')
      .leftJoinAndSelect('cost_center.division', 'division')
      .leftJoinAndSelect('cost_center.department', 'department')
      .leftJoinAndSelect('cost_center.section', 'section')
      .leftJoinAndSelect('cost_center.sub_section', 'sub_section')
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.details', 'details')
      .leftJoinAndSelect('user.created_by', 'created_by')
      .leftJoinAndSelect('user.updated_by', 'updated_by')
      .leftJoinAndSelect('user.deleted_by', 'deleted_by')
      .leftJoinAndSelect('user.default_address', 'default_address')
      // Filter assignments to only include Active, non-deleted ones
      .leftJoinAndSelect(
        'user.assignments',
        'assignments',
        "assignments.status = 'Active' AND assignments.deleted_at IS NULL",
      )
      .leftJoinAndSelect('assignments.group', 'group')
      .where('user.email = :email', { email })
      .withDeleted()
      .getOne();

    if (!entity) return null;

    // Map to domain but include credentials for authentication
    const user = UserMapper.toDomain(entity);
    user.password = entity.password ?? undefined;
    user.salt = entity.salt ?? undefined;

    return user;
  }

  async findAll(): Promise<
    Pick<User, 'id' | 'first_name' | 'middle_name' | 'last_name' | 'user_id'>[]
  > {
    const users = await this.usersRepository.find({
      where: [{ status: In(['Cancelled', 'Active']) }],
    });

    return users.map((entity) => {
      const { id, first_name, middle_name, last_name, user_id } =
        UserMapper.toDomain(entity);
      return { id, first_name, middle_name, last_name, user_id };
    });
  }

  async findEligibleSellerUsers(): Promise<
    Pick<User, 'id' | 'first_name' | 'middle_name' | 'last_name'>[]
  > {
    const entities = await this.usersRepository
      .createQueryBuilder('users')
      .leftJoin(SellerEntity, 'sellers', 'sellers.user_id = users.id')
      .where('sellers.user_id IS NULL')
      .andWhere('users.status IN (:...statuses)', {
        statuses: [StatusEnum.ACTIVE, StatusEnum.CANCELLED],
      })
      .select([
        'users.id AS id',
        'users.first_name AS first_name',
        'users.middle_name AS middle_name',
        'users.last_name AS last_name',
      ])
      .orderBy('users.first_name', 'ASC')
      .addOrderBy('users.last_name', 'ASC')
      .getRawMany<{
        id: number;
        first_name: string;
        middle_name: string | null;
        last_name: string;
      }>();

    return entities.map((entity) => ({
      id: Number(entity.id),
      first_name: entity.first_name,
      middle_name: entity.middle_name,
      last_name: entity.last_name,
    }));
  }

  // async findManyBy(queryParams: GetQueryParams) {
  //   const { skip, take, sort, where } = new TypeOrmStrategy().get(
  //     queryParams as BaseGetDto,
  //   );
  //   const [entities, totalResults] = await this.usersRepository.findAndCount({
  //     skip: skip,
  //     take: take,
  //     order: sort,
  //     where,
  //   });
  //
  //   const data = entities.map((entity) => {
  //     const { id, first_name, middle_name, last_name } =
  //       UserMapper.toDomain(entity);
  //     return { id, first_name, middle_name, last_name };
  //   });
  //
  //   return { data, totalCount: totalResults };
  // }

  async update(id: User['id'], payload: Partial<User>): Promise<User> {
    const entity = await this.usersRepository.findOne({
      where: { id: Number(id) },
    });

    if (!entity) {
      throw new Error('User not found');
    }

    // Preserve sensitive fields from entity if not in payload
    const sensitiveFields = {
      password: payload.password ?? entity.password,
      salt: payload.salt ?? entity.salt,
      device_pin: payload.device_pin ?? entity.device_pin,
    };

    const updatedEntity = await this.usersRepository.save(
      this.usersRepository.create({
        ...UserMapper.toPersistence({
          ...UserMapper.toDomain(entity),
          ...payload,
        }),
        ...sensitiveFields,
      }),
    );

    return UserMapper.toDomain(updatedEntity);
  }

  async remove(id: User['id'], causer: User | null): Promise<void> {
    const entity = await this.usersRepository.findOne({
      where: { id },
    });

    if (!entity) throw new NotFoundException('User does not exist!');

    const transactionManager = this.usersRepository.manager;
    const causerEntity = causer ? UserMapper.toPersistence(causer) : null;

    await transactionManager.transaction(async (manager: EntityManager) => {
      try {
        // Attempt to soft delete the entity with status update
        await manager.update(
          UserEntity,
          { id: entity.id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: causerEntity,
            deleted_by: causerEntity,
            deleted_at: new Date(),
          },
        );
        // await manager.softDelete(UserEntity, { id: entity.id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Fallback to updating status only if soft delete fails
        await manager.update(
          UserEntity,
          { id: entity.id },
          {
            status: StatusEnum.CANCELLED,
            updated_by: causerEntity,
            deleted_by: causerEntity,
            deleted_at: new Date(),
          },
        );
      }
    });
  }

  async bulkRemove(users: User[], causer: User | null): Promise<void> {
    const removalPromises = users.map((user) => {
      return this.remove(user.id, causer);
    });

    try {
      await Promise.all(removalPromises);
    } catch (error) {
      console.error('Error during users bulk remove:', error);

      throw new UnprocessableEntityException('Some users could not be removed');
    }
  }

  async getUserGroupsFromAssignments(id: User['id']) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id'])
      .leftJoin('user.assignments', 'assignments')
      .addSelect(['assignments.id'])
      .leftJoin('assignments.group', 'groups')
      .addSelect(['groups.group_name'])
      .where('user.id =:id', { id })
      .getOne();

    if (!user) throw new NotFoundException('User not found');

    return GetUserGroupsFromAssignmentsMapper.toDomain(user);
  }

  async getUserPermissions(id: User['id']) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id'])
      .leftJoin(
        'user.assignments',
        'assignments',
        'assignments.status = :assignmentStatus AND assignments.deleted_at IS NULL',
        { assignmentStatus: 'Active' },
      )
      .addSelect(['assignments.id'])
      .leftJoin('assignments.group', 'groups', 'groups.deleted_at IS NULL')
      .addSelect(['groups.id'])
      .leftJoin(
        'groups.user_permissions',
        'permission',
        'permission.status = :permissionStatus AND permission.deleted_at IS NULL',
        { permissionStatus: 'Active' },
      )
      .addSelect(['permission.id', 'permission.permissions'])
      .leftJoin('permission.menu', 'menus')
      .addSelect(['menus.id'])
      .addSelect(['menus.menu_code'])
      .where('user.id = :id', { id })
      .getMany();

    if (!user || user.length === 0) {
      return {};
    }

    return GetUserPermissionsMapper.toDomain(user);
  }

  private getRelationOptions(): FindOneOptions<UserEntity>['relations'] {
    return {
      cost_center: {
        division: true,
        department: true,
        section: true,
        sub_section: true,
      },
      seller: true,
      details: true,
      created_by: true,
      updated_by: true,
      deleted_by: true,
      default_address: true,
      assignments: {
        group: true,
      },
    };
  }

  private getSelectOptions(): FindOneOptions<UserEntity>['select'] {
    return {
      id: true,
      user_id: true,
      system_admin: true,
      email: true,
      first_name: true,
      middle_name: true,
      last_name: true,
      suffix: true,
      image: true,
      status: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      cost_center: { id: true, cost_center_code: true },
    };
  }

  private getWhereClause(filterQuery: QueryUserDto | undefined) {
    const where: FindOptionsWhere<UserEntity>[] = [];

    if (!filterQuery) return [];

    if (filterQuery.search) {
      const search = ILike(`%${filterQuery.search}%`);

      where.push({ first_name: search });
      where.push({ last_name: search });
      where.push({ email: search });
      where.push({ middle_name: search });
      where.push({ cost_center: search });
    }

    if (filterQuery.status) {
      const status = filterQuery.status.split(',');

      where.push({ status: In(status) });
    }

    return where;
  }

  async getUserCostCenter(id: User['id']): Promise<NullableType<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.cost_center', 'cost_center')
      .select(['user.id', 'cost_center.id', 'cost_center.cost_center_code'])
      .where('user.id = :id', { id: Number(id) });

    const entity = await queryBuilder.getOne();

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async lookup(loadOptions: UserLookupDto) {
    let { filter, sort: order } = loadOptions;
    const { exclude_ids } = loadOptions;

    const fieldMaps = [
      {
        field: 'user_id',
        relatedFields: ['users.user_id'],
      },
      {
        field: 'first_name',
        relatedFields: ['users.first_name'],
      },
      {
        field: 'last_name',
        relatedFields: ['users.last_name'],
      },
      {
        field: 'email',
        relatedFields: ['users.email'],
      },
    ];

    if (filter) {
      filter = await createFieldFilters(filter, fieldMaps);
    }

    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'users.user_id': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    const query = this.usersRepository
      .createQueryBuilder('users')
      .select([
        'users.id',
        'users.user_id',
        'users.first_name',
        'users.last_name',
        'users.email',
      ])
      .where(where)
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);

    if (exclude_ids) {
      const excludeIds = exclude_ids
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id));

      if (excludeIds.length > 0) {
        query.andWhere('users.id NOT IN (:...ids)', { ids: excludeIds });
      }
    }

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => ({
      id: entity.id,
      user_id: entity.user_id,
      first_name: entity.first_name,
      last_name: entity.last_name,
      email: entity.email,
    }));
    return { data, totalCount };
  }

  async bulkUpdate(
    ids: User['id'][],
    payload: DeepPartial<User>,
  ): Promise<void> {
    const persistencePayload = UserMapper.toPersistence(payload as User);
    await this.usersRepository.update(ids, persistencePayload);
  }
}
