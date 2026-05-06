// import { IPaginatedResult } from '@/utils/types/paginated-result';
// import { FindAllUserGroupsDto } from '@/user-groups/dto/find-all-user-groups.dto';
import { StatusEnum } from '@/user-groups/user-groups.enum';
import { User } from '@/users/domain/user';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserGroupDto } from '@/user-groups/dto/create-user-group.dto';
import { UpdateUserGroupDto } from '@/user-groups/dto/update-user-group.dto';
import { BaseUserGroupRepository } from '@/user-groups/persistence/base-user-group.repository';
// import { IPaginationOptions } from '@/utils/types/pagination-options';
import { UserGroup } from '@/user-groups/domain/user-group';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { UserAssignmentsService } from '@/user-assignments/user-assignments.service';
import { UserPermissionsService } from '@/user-permissions/user-permissions.service';

@Injectable()
export class UserGroupsService {
  constructor(
    // Dependencies here
    private readonly userGroupRepository: BaseUserGroupRepository,
    @Inject(forwardRef(() => UserAssignmentsService))
    private userAssignmentsService: UserAssignmentsService,
    @Inject(forwardRef(() => UserPermissionsService))
    private userPermissionsService: UserPermissionsService,
  ) {}

  async create(createUserGroupDto: CreateUserGroupDto, causer: User) {
    // Do not remove comment below.
    // <creating-property />

    const userGroupEntity = await this.userGroupRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      ...createUserGroupDto,
      status: StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });

    if (createUserGroupDto.members) {
      await Promise.all(
        createUserGroupDto.members.map(async (member) => {
          await this.userAssignmentsService.create(
            {
              group: userGroupEntity.id,
              user: member.id,
            },
            causer,
          );
        }),
      );
    }

    if (createUserGroupDto.menus) {
      await Promise.all(
        createUserGroupDto.menus.map(async (menu) => {
          const { id, permissions } = menu;
          await this.userPermissionsService.create(
            {
              group: userGroupEntity.id,
              menu: id,
              permissions: permissions,
            },
            causer,
          );
        }),
      );
    }

    return await this.findById(userGroupEntity.id);
  }

  findManyBy(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.userGroupRepository.findManyBy(queryParamsParsed);
  }

  // findAllWithPagination({
  //   filterQuery,
  //   status,
  //   paginationOptions,
  // }: {
  //   filterQuery: FindAllUserGroupsDto['search'];
  //   status: StatusEnum[] | 'all';
  //   paginationOptions: IPaginationOptions;
  // }): Promise<IPaginatedResult<UserGroup>> {
  //   return this.userGroupRepository.findAllWithPagination({
  //     filterQuery,
  //     status,
  //     paginationOptions: {
  //       page: paginationOptions.page,
  //       limit: paginationOptions.limit,
  //     },
  //   });
  // }

  findById(id: UserGroup['id']) {
    return this.userGroupRepository.findById(id);
  }

  findByName(name: string) {
    return this.userGroupRepository.findByName(name);
  }

  findCustomerGroup() {
    return this.userGroupRepository.findCustomerGroup();
  }

  findByIds(ids: UserGroup['id'][]) {
    return this.userGroupRepository.findByIds(ids);
  }

  findAll() {
    return this.userGroupRepository.findAll();
  }

  async update(
    id: UserGroup['id'],
    updateUserGroupDto: UpdateUserGroupDto,
    causer: User,
  ) {
    // Do not remove comment below.
    // <updating-property />

    // @todo update members
    const userGroupEntity = await this.findById(id);
    if (!userGroupEntity) {
      throw new NotFoundException(`User group with id ${id} not found`);
    }

    // Prevent updates to cancelled groups (except status changes for restoration)
    if (
      userGroupEntity.status === StatusEnum.CANCELLED &&
      !updateUserGroupDto.status
    ) {
      throw new BadRequestException(
        'Cannot update a cancelled user group. Please restore it first.',
      );
    }

    const member_ids = updateUserGroupDto.members?.map((i) => i.id) ?? [];
    const menuIds = updateUserGroupDto.menus?.map((i) => i.id) ?? [];

    // Filter out assignments where user is null/undefined or has no id (e.g., soft-deleted users)
    const user_assignments =
      userGroupEntity?.user_assignments?.filter((ua) => ua.user?.id != null) ??
      [];
    const existing_user_ids = user_assignments.map(
      (user_assignment) => user_assignment.user.id,
    );
    const removed_user_assignment_ids = user_assignments
      .filter(
        (user_assignment) =>
          user_assignment.status === StatusEnum.ACTIVE &&
          !member_ids.includes(user_assignment.user.id),
      )
      .map((u) => u.id);

    // delete if there are removed members
    if (removed_user_assignment_ids.length > 0) {
      await this.userAssignmentsService.removeByIds(
        removed_user_assignment_ids,
      );
    }

    // add new members
    const new_members = updateUserGroupDto.members?.filter(
      (member) => !existing_user_ids.includes(member.id),
    );

    if (new_members) {
      await Promise.all(
        new_members.map(async (member) => {
          await this.userAssignmentsService.create(
            {
              group: id,
              user: member.id,
            },
            causer,
          );
        }),
      );
    }

    // start of update menu access
    const existingMenuIds =
      userGroupEntity?.user_permissions?.map((up) => up.menu.id) ?? [];

    // new menu access
    const newMenus =
      updateUserGroupDto.menus?.filter(
        (menu) => !existingMenuIds.includes(menu.id),
      ) ?? [];

    // removed menu access
    const removedMenuIds = userGroupEntity?.user_permissions
      ?.filter(
        (userPermission) =>
          userPermission.status === StatusEnum.ACTIVE &&
          !menuIds.includes(userPermission.menu.id),
      )
      ?.map((u) => u.id);

    // delete removed menu access
    if (removedMenuIds) {
      await Promise.all(
        removedMenuIds.map(async (menuId) => {
          await this.userPermissionsService.remove(menuId, causer);
        }),
      );
    }

    // reactivate existing menu access
    const existingPermissions = userGroupEntity?.user_permissions?.filter(
      (userPermission) =>
        userPermission.status === StatusEnum.CANCELLED &&
        menuIds.includes(userPermission.menu.id),
    );

    if (existingPermissions) {
      await Promise.all(
        existingPermissions.map(async (userPermission) => {
          await this.userPermissionsService.reactivate(
            userPermission.id,
            causer,
            true, // include soft delete
          );
        }),
      );
    }

    // creation of menu access
    if (newMenus.length) {
      await Promise.all(
        newMenus.map(async (menu) => {
          const { id, permissions } = menu;
          await this.userPermissionsService.create(
            {
              group: userGroupEntity.id,
              menu: id,
              permissions: permissions,
            },
            causer,
          );
        }),
      );
    }

    return this.userGroupRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      ...updateUserGroupDto,
      updated_by: causer,
    });
  }

  async updateStatus(
    id: number,
    status: StatusEnum,
    causer: User,
  ): Promise<UserGroup> {
    // Validate status
    const validStatuses = StatusEnum ? Object.values(StatusEnum) : [];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    // Get the user group first to ensure it exists
    const userGroup = await this.findById(id);
    if (!userGroup) {
      throw new NotFoundException('User group does not exist!');
    }

    // Update the status using the existing update method
    const updateDto: UpdateUserGroupDto = {
      status,
    };
    const updatedGroup = await this.update(id, updateDto, causer);
    if (!updatedGroup) {
      throw new NotFoundException('Failed to update user group status');
    }
    return updatedGroup;
  }

  async restore(id: UserGroup['id'], causer: User): Promise<UserGroup> {
    // Check if causer is an admin
    const causerGroups =
      await this.userAssignmentsService.getUserGroupsFromAssignments(causer.id);
    const isAdmin = causerGroups.some(
      (groupName) => groupName.toLowerCase() === 'admin',
    );

    if (!isAdmin) {
      throw new ForbiddenException('Only admin users can restore user groups.');
    }

    const userGroup = await this.findById(id);

    if (!userGroup) throw new NotFoundException('User Group does not exist!');

    if (userGroup.status !== StatusEnum.CANCELLED) {
      throw new BadRequestException(
        'Only cancelled user groups can be restored.',
      );
    }

    await this.userGroupRepository.update(id, {
      status: StatusEnum.ACTIVE,
      updated_by: causer,
      deleted_by: null,
      deleted_at: null,
    });

    const restoredGroup = await this.findById(id);
    if (!restoredGroup) {
      throw new NotFoundException('Failed to restore user group');
    }
    return restoredGroup;
  }

  async remove(id: UserGroup['id'], causer: User) {
    const userGroup = await this.findById(id);

    if (!userGroup) throw new NotFoundException('User Group does not exist!');

    // Prevent deletion of Admin group
    if (userGroup.group_name?.toLowerCase() === 'admin') {
      throw new ForbiddenException(
        'The Admin group cannot be deleted as it is a system-protected group.',
      );
    }

    // Only check active members on first delete (Active → Cancelled)
    if (userGroup.status !== StatusEnum.CANCELLED) {
      const activeMembers = userGroup.user_assignments?.filter(
        (assignment) => assignment.status === StatusEnum.ACTIVE,
      );

      if (activeMembers && activeMembers.length > 0) {
        throw new BadRequestException(
          `Cannot delete user group with ${activeMembers.length} active member(s). Please remove all members before deleting the group.`,
        );
      }
    }

    return this.userGroupRepository.remove(id, causer);
  }

  // async updateMembers(
  //   id: UserGroup['id'],
  //   users: UserAssignment['id'][],
  //   causer: User,
  // ) {
  //   // @todo get existing group members
  //   const userGroupEntity = await this.userGroupRepository.findById(id);
  //
  //   if (!userGroupEntity)
  //     throw new NotFoundException('User Group does not exist!');
  //
  //   const user_assignments = userGroupEntity['user_assignments'];
  //   // @todo filter members removed from raw and delete
  //   // @todo filter new members and create
  //
  //   console.log(user_assignments);
  //   //this.userAssignmentRepository.
  //
  //   return user_assignments;
  // }
}
