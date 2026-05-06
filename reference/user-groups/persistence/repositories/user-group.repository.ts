import { StatusEnum } from '@/user-groups/user-groups.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, ILike } from 'typeorm';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { UserGroup } from '@/user-groups/domain/user-group';
import { BaseUserGroupRepository } from '@/user-groups/persistence/base-user-group.repository';
import { UserGroupMapper } from '@/user-groups/persistence/mappers/user-group.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
@Injectable()
export class UserGroupRepository implements BaseUserGroupRepository {
  constructor(
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
  ) {}

  async create(data: UserGroup): Promise<UserGroup> {
    const persistenceModel = UserGroupMapper.toPersistence(data);
    const newEntity = await this.userGroupRepository.save(
      this.userGroupRepository.create(persistenceModel),
    );
    return UserGroupMapper.toDomain(newEntity);
  }

  async findManyBy(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps = [];

    if (filter) {
      filter = await createFieldFilters(filter, fieldMaps);
    }

    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'user-group.name': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    // Recursively check if 'Cancelled' appears anywhere in the filter tree
    const containsCancelled = (f: unknown): boolean => {
      if (!Array.isArray(f)) return false;
      return f.some(
        (item) =>
          item === 'Cancelled' ||
          (Array.isArray(item) && containsCancelled(item)),
      );
    };
    const isCancelledFilter = containsCancelled(loadOptions.filter);

    // Prefix bare field names with the QueryBuilder alias to avoid ambiguity
    const aliasedWhere = where
      ? (where as string).replace(
          /\b(group_name|description|status)\b/g,
          '"user-group".$1',
        )
      : '';

    const query = this.userGroupRepository
      .createQueryBuilder('user-group')
      .where(aliasedWhere || '1=1')
      .andWhere('"user-group".seller_id IS NULL')
      .andWhere(
        isCancelledFilter
          ? '"user-group".deleted_at IS NOT NULL'
          : '"user-group".deleted_at IS NULL',
      )
      .withDeleted()
      .skip(skip)
      .take(take);

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => UserGroupMapper.toDomain(entity));
    return { data, totalCount };
  }

  async findById(id: UserGroup['id']): Promise<NullableType<UserGroup>> {
    // Use QueryBuilder to show deleted groups but exclude soft-deleted relations
    const entity = await this.userGroupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect(
        'group.user_permissions',
        'permissions',
        'permissions.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'group.user_assignments',
        'assignments',
        "assignments.deleted_at IS NULL AND assignments.status = 'Active'",
      )
      .leftJoinAndSelect('assignments.user', 'user', 'user.deleted_at IS NULL')
      .leftJoinAndSelect('permissions.menu', 'menu')
      .where('group.id = :id', { id })
      .withDeleted() // Allow viewing deleted groups
      .getOne();

    // Filter out assignments where the user is null (deleted)
    if (entity?.user_assignments) {
      entity.user_assignments = entity.user_assignments.filter(
        (assignment) => assignment.user !== null,
      );
    }

    return entity ? UserGroupMapper.toDomain(entity) : null;
  }

  async findByIds(ids: UserGroup['id'][]): Promise<UserGroup[]> {
    const entities = await this.userGroupRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => UserGroupMapper.toDomain(entity));
  }

  async findAll(): Promise<Pick<UserGroup, 'group_name' | 'description'>[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { status: In([StatusEnum.ACTIVE]), seller_id: IsNull() },
    });

    return userGroups.map((entity) => {
      const { group_name, description } = UserGroupMapper.toDomain(entity);
      return { group_name, description };
    });
  }

  async findByName(name: string): Promise<NullableType<UserGroup>> {
    const entity = await this.userGroupRepository.findOne({
      where: { group_name: name },
    });
    return entity ? UserGroupMapper.toDomain(entity) : null;
  }

  async findCustomerGroup(): Promise<NullableType<UserGroup>> {
    const entity = await this.userGroupRepository.findOne({
      where: {
        group_name: ILike('customer'),
        seller_id: IsNull(),
      },
    });
    return entity ? UserGroupMapper.toDomain(entity) : null;
  }

  async update(
    id: UserGroup['id'],
    payload: Partial<UserGroup>,
  ): Promise<UserGroup> {
    const entity = await this.userGroupRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.userGroupRepository.save(
      this.userGroupRepository.create(
        UserGroupMapper.toPersistence({
          ...UserGroupMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return UserGroupMapper.toDomain(updatedEntity);
  }

  async remove(id: UserGroup['id'], causer: { id: number }): Promise<void> {
    // Use QueryBuilder to avoid eager relation loading issues on soft-deleted rows
    const entity = await this.userGroupRepository
      .createQueryBuilder('group')
      .select(['group.id', 'group.deleted_at'])
      .where('group.id = :id', { id })
      .withDeleted()
      .getOne();

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    if (entity.deleted_at) {
      // Second delete: hard delete — use query builder to bypass soft-delete filter
      await this.userGroupRepository
        .createQueryBuilder()
        .delete()
        .from(UserGroupEntity)
        .where('id = :id', { id })
        .execute();
    } else {
      // First delete: mark Cancelled + soft delete in one raw query
      await this.userGroupRepository.manager.query(
        `UPDATE user_groups SET status = $1, deleted_by = $2, updated_by = $2, deleted_at = NOW() WHERE id = $3`,
        [StatusEnum.CANCELLED, causer.id, id],
      );
    }
  }
}
