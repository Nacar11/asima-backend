import { FindAllUserPermissionsDto } from '@/user-permissions/dto/find-all-user-permissions.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { UserPermission } from '@/user-permissions/domain/user-permission';
import { BaseUserPermissionRepository } from '@/user-permissions/persistence/base-user-permission.repository';
import { UserPermissionMapper } from '@/user-permissions/persistence/mappers/user-permission.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { StatusEnum } from '@/user-permissions/user-permissions.enum';

@Injectable()
export class UserPermissionRepository implements BaseUserPermissionRepository {
  constructor(
    @InjectRepository(UserPermissionEntity)
    private readonly userPermissionRepository: Repository<UserPermissionEntity>,
  ) {}

  async create(data: UserPermission): Promise<UserPermission> {
    const persistenceModel = UserPermissionMapper.toPersistence(data);
    const newEntity = await this.userPermissionRepository.save(
      this.userPermissionRepository.create(persistenceModel),
    );
    return UserPermissionMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    menu,
    group,
    status,
    paginationOptions,
  }: {
    group: FindAllUserPermissionsDto['group'];
    menu: FindAllUserPermissionsDto['menu'];
    status: FindAllUserPermissionsDto['status'] | 'all';
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<UserPermission>> {
    const where = this.getWhereClause(menu, group, status);

    const [entities, totalResults] =
      await this.userPermissionRepository.findAndCount({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        where,
      });

    const data = entities.map((entity) =>
      UserPermissionMapper.toDomain(entity),
    );
    return { data, totalResults };
  }

  async findById(
    id: UserPermission['id'],
  ): Promise<NullableType<UserPermission>> {
    const entity = await this.userPermissionRepository.findOne({
      where: { id },
    });

    return entity ? UserPermissionMapper.toDomain(entity) : null;
  }

  async findByIds(ids: UserPermission['id'][]): Promise<UserPermission[]> {
    const entities = await this.userPermissionRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => UserPermissionMapper.toDomain(entity));
  }

  async findAll(): Promise<UserPermission[]> {
    const userPermissions = await this.userPermissionRepository.find({
      where: [{ status: In([StatusEnum.ACTIVE]) }],
    });

    return userPermissions.map((entity) =>
      UserPermissionMapper.toDomain(entity),
    );
  }

  async update(
    id: UserPermission['id'],
    payload: Partial<UserPermission>,
    includeSoftDelete: boolean = false, // to include soft deleted records, default is false
  ): Promise<UserPermission> {
    const entity = await this.userPermissionRepository.findOne({
      where: { id },
      withDeleted: includeSoftDelete,
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.userPermissionRepository.save(
      this.userPermissionRepository.create(
        UserPermissionMapper.toPersistence({
          ...UserPermissionMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return UserPermissionMapper.toDomain(updatedEntity);
  }

  async remove(id: UserPermission['id']): Promise<void> {
    const entity = await this.userPermissionRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    await this.userPermissionRepository.softDelete({ id });
  }

  async getUserGroupPermissions(groupIds: Array<number>) {
    if (!groupIds || groupIds.length === 0) {
      return [];
    }

    const entities = await this.userPermissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.group', 'group')
      .leftJoinAndSelect('permission.menu', 'menu')
      .where('permission.group IN (:...groupIds)', { groupIds })
      .andWhere('permission.status = :status', { status: StatusEnum.ACTIVE })
      .andWhere('permission.deleted_at IS NULL')
      .getMany();

    return entities;
  }

  private getWhereClause(
    menu: FindAllUserPermissionsDto['menu'],
    group: FindAllUserPermissionsDto['group'],
    status: FindAllUserPermissionsDto['status'] | 'all',
  ) {
    const where: FindOptionsWhere<UserPermissionEntity>[] = [];

    if (menu) where.push({ menu: { id: menu } });

    if (group) where.push({ group: { id: group } });

    where.push({
      status:
        status == 'all'
          ? In([StatusEnum.ACTIVE, StatusEnum.CANCELLED])
          : status,
    });

    return where;
  }
}
