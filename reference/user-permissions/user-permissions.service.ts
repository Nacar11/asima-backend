import { FindAllUserPermissionsDto } from '@/user-permissions/dto/find-all-user-permissions.dto';
import { MenusService } from '@/menus/menus.service';
import { UserGroupsService } from '@/user-groups/user-groups.service';
import { Menu } from '@/menus/domain/menu';
import { UserGroup } from '@/user-groups/domain/user-group';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserPermissionDto } from '@/user-permissions/dto/create-user-permission.dto';
import { UpdateUserPermissionDto } from '@/user-permissions/dto/update-user-permission.dto';
import { BaseUserPermissionRepository } from '@/user-permissions/persistence/base-user-permission.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { UserPermission } from '@/user-permissions/domain/user-permission';
import { StatusEnum } from '@/user-permissions/user-permissions.enum';
import { User } from '@/users/domain/user';
import { BaseUserRepository } from '../users/persistence/base-user.repository';
import { PermissionCacheService } from '@/permissions/permission-cache.service';

@Injectable()
export class UserPermissionsService {
  constructor(
    // Dependencies here
    private readonly userPermissionRepository: BaseUserPermissionRepository,
    @Inject(forwardRef(() => UserGroupsService))
    private readonly userGroupService: UserGroupsService,
    private readonly menuService: MenusService,
    private readonly userRepository: BaseUserRepository,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  async create(createUserPermissionDto: CreateUserPermissionDto, causer: User) {
    // Do not remove comment below.
    // <creating-property />

    const mappedUserPermission = await this.mapUserPermissionDto(
      createUserPermissionDto,
    );

    const result = await this.userPermissionRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      ...mappedUserPermission,
      status: StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });

    // Invalidate permission cache for all users in the affected group
    await this.invalidateCacheForGroup(createUserPermissionDto.group);

    return result;
  }

  findAllWithPagination({
    group,
    menu,
    status,
    paginationOptions,
  }: {
    group: FindAllUserPermissionsDto['group'];
    menu: FindAllUserPermissionsDto['menu'];
    status: FindAllUserPermissionsDto['status'] | 'all';
    paginationOptions: IPaginationOptions;
  }) {
    return this.userPermissionRepository.findAllWithPagination({
      group,
      menu,
      status,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: UserPermission['id']) {
    return this.userPermissionRepository.findById(id);
  }

  findByIds(ids: UserPermission['id'][]) {
    return this.userPermissionRepository.findByIds(ids);
  }

  findAll() {
    return this.userPermissionRepository.findAll();
  }

  async update(
    id: UserPermission['id'],
    updateUserPermissionDto: UpdateUserPermissionDto,
    causer: User,
  ) {
    // Do not remove comment below.
    // <updating-property />
    const mappedUserPermission = await this.mapUserPermissionDto(
      updateUserPermissionDto,
    );

    const result = await this.userPermissionRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      ...mappedUserPermission,
      updated_by: causer,
    });

    // Invalidate permission cache for all users in the affected group
    await this.invalidateCacheForGroup(updateUserPermissionDto.group);

    return result;
  }

  async reactivate(
    id: UserPermission['id'],
    causer: User,
    includeSoftDelete: boolean = false, // to include soft deleted records
  ) {
    return this.userPermissionRepository.update(
      id,
      {
        status: StatusEnum.ACTIVE,
        updated_by: causer,
        deleted_by: null,
        deleted_at: null,
      },
      includeSoftDelete,
    );
  }

  async remove(id: UserPermission['id'], causer: User) {
    const userPermission = await this.findById(id);

    if (!userPermission)
      throw new NotFoundException('UserPermission does not exist!');

    const groupId = userPermission.group?.id;

    await this.userPermissionRepository.update(id, {
      status: StatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
    });

    const result = await this.userPermissionRepository.remove(id);

    // Invalidate permission cache for all users in the affected group
    if (groupId) {
      await this.invalidateCacheForGroup(groupId);
    }

    return result;
  }

  async getUserGroupPermissions(groupIds: Array<number>) {
    return await this.userPermissionRepository.getUserGroupPermissions(
      groupIds,
    );
  }

  matchUserPermission(
    allowedPermissions: UserPermission | UserPermission[],
    userPermissions: Array<UserPermission>,
  ) {
    // Handle array format from decorator (spread operator creates array)
    // e.g., @Permissions({ SM01: 'View' }, { SM02: 'Edit' }) results in an array
    const permissionsToCheck = Array.isArray(allowedPermissions)
      ? allowedPermissions
      : [allowedPermissions];

    for (const permissionObj of permissionsToCheck) {
      for (const userPermissionEntity of userPermissions) {
        for (const [key, value] of Object.entries(permissionObj)) {
          const menuCode = userPermissionEntity.menu?.menu_code;
          const permissions = userPermissionEntity.permissions || [];

          // find matching value from two arrays Ex. permissions = ['View', 'Edit'], allowedPermissions value = ['View'], should return matched ['View']
          // should also match both string values or array values Ex. permission 'View', 'Edit' instead of ['View', 'Edit']
          // Normalize value to array to handle both string and array cases
          const valueArray = Array.isArray(value) ? value : [value];
          const isPermissionsMatched =
            permissions.filter((permission) => valueArray.includes(permission))
              .length > 0;

          if (key === menuCode && isPermissionsMatched) {
            return true;
          }
        }
      }
    }

    return false;
  }

  async getUserPermissions(
    userId: number,
  ): Promise<Record<string, any> | undefined> {
    return await this.userRepository.getUserPermissions(userId);
  }

  private async mapUserPermissionDto({
    group,
    menu,
    permissions,
  }: {
    group: number;
    menu: number;
    permissions: string[];
  }): Promise<{
    group: UserGroup;
    menu: Menu;
    permissions: string[];
  }> {
    const groupEntity = await this.userGroupService.findById(group);
    if (!groupEntity)
      throw new UnprocessableEntityException('Group does not exist!');

    const menuEntity = await this.menuService.findById(menu);
    if (!menuEntity)
      throw new UnprocessableEntityException('Menu does not exist!');

    return { group: groupEntity, menu: menuEntity, permissions };
  }

  /**
   * Invalidate permission cache for all users in a group
   */
  private async invalidateCacheForGroup(groupId: number): Promise<void> {
    const group = await this.userGroupService.findById(groupId);
    if (!group || !group.user_assignments) return;

    const userIds = group.user_assignments
      .filter((assignment) => assignment.user?.id)
      .map((assignment) => assignment.user.id);

    if (userIds.length > 0) {
      await this.permissionCacheService.invalidateMultipleUserPermissions(
        userIds,
      );
    }
  }
}
