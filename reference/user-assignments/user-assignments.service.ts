import { UserGroup } from '@/user-groups/domain/user-group';
import { UsersService } from '@/users/users.service';
import { UserGroupsService } from '@/user-groups/user-groups.service';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserAssignmentDto } from '@/user-assignments/dto/create-user-assignment.dto';
import { CreateUserAssignmentsDto } from '@/user-assignments/dto/create-user-assignments.dto';
import { UpdateUserAssignmentDto } from '@/user-assignments/dto/update-user-assignment.dto';
import { BaseUserAssignmentRepository } from '@/user-assignments/persistence/base-user-assignment.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';
import { StatusEnum } from '@/user-assignments/user-assignments.enum';
import { User } from '@/users/domain/user';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { PermissionCacheService } from '@/permissions/permission-cache.service';

@Injectable()
export class UserAssignmentsService {
  constructor(
    // Dependencies here
    private readonly userAssignmentRepository: BaseUserAssignmentRepository,
    private readonly userRepository: BaseUserRepository,
    @Inject(forwardRef(() => UserGroupsService))
    private userGroupService: UserGroupsService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  async create(createUserAssignmentDto: CreateUserAssignmentDto, causer: User) {
    // Do not remove comment below.
    // <creating-property />
    const mappedUserAssignment = await this.mapUserAssignmentDto(
      createUserAssignmentDto,
    );

    const result = await this.userAssignmentRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      ...mappedUserAssignment,
      status: StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });

    // Invalidate permission cache for the user
    await this.permissionCacheService.invalidateUserPermissions(
      mappedUserAssignment.user.id,
    );

    return result;
  }

  async createBulk(
    createUserAssignmentsDto: CreateUserAssignmentsDto,
    causer: User,
  ) {
    const { group, users } = createUserAssignmentsDto;

    const groupEntity = await this.userGroupService.findById(group);
    if (!groupEntity)
      throw new UnprocessableEntityException('Group does not exist!');

    const createdUsers: UserAssignment[] = [];

    await Promise.all(
      users.map(async (user) => {
        const userEntity = await this.userService.findById(user);
        if (!userEntity)
          throw new UnprocessableEntityException('User does not exist!');

        const new_user = await this.userAssignmentRepository.create({
          group: groupEntity,
          user: userEntity,
          status: StatusEnum.ACTIVE,
          created_by: causer,
          updated_by: causer,
        });

        createdUsers.push(new_user);
      }),
    );

    // Invalidate permission cache for all affected users
    await this.permissionCacheService.invalidateMultipleUserPermissions(users);

    return createdUsers;
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.userAssignmentRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: UserAssignment['id']) {
    return this.userAssignmentRepository.findById(id);
  }

  findByIds(ids: UserAssignment['id'][]) {
    return this.userAssignmentRepository.findByIds(ids);
  }

  findAll() {
    return this.userAssignmentRepository.findAll();
  }

  async update(
    id: UserAssignment['id'],

    updateUserAssignmentDto: UpdateUserAssignmentDto,
    causer: User,
  ) {
    // Do not remove comment below.
    // <updating-property />
    const mappedUserAssignment = await this.mapUserAssignmentDto(
      updateUserAssignmentDto as {
        group: number;
        user: number;
      },
    );

    const result = await this.userAssignmentRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      ...mappedUserAssignment,
      status: updateUserAssignmentDto.status,
      updated_by: causer,
    });

    // Invalidate permission cache for the user
    await this.permissionCacheService.invalidateUserPermissions(
      mappedUserAssignment.user.id,
    );

    return result;
  }

  async remove(id: UserAssignment['id'], causer: User) {
    const userAssignment = await this.findById(id);

    if (!userAssignment)
      throw new NotFoundException('User Group does not exist!');

    const userId = userAssignment.user?.id;

    await this.userAssignmentRepository.update(id, {
      status: StatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
    });

    const result = await this.userAssignmentRepository.remove(id);

    // Invalidate permission cache for the user
    if (userId) {
      await this.permissionCacheService.invalidateUserPermissions(userId);
    }

    return result;
  }

  async removeByIds(ids: UserAssignment['id'][]) {
    return this.userAssignmentRepository.removeByIds(ids);
  }

  async removeByUserAndGroup(userId: number, groupId: number): Promise<void> {
    await this.userAssignmentRepository.removeByUserAndGroup(userId, groupId);

    // Invalidate permission cache for the user
    await this.permissionCacheService.invalidateUserPermissions(userId);
  }

  async findActiveByUserId(userId: number): Promise<UserAssignment[]> {
    return this.userAssignmentRepository.findActiveByUserId(userId);
  }

  async removeAllByUserId(userId: number, causer: User): Promise<void> {
    const assignments = await this.findActiveByUserId(userId);

    // Remove all active assignments for this user
    await Promise.all(
      assignments.map(async (assignment) => {
        await this.userAssignmentRepository.update(assignment.id, {
          status: StatusEnum.CANCELLED,
          updated_by: causer,
          deleted_by: causer,
        });
        await this.userAssignmentRepository.remove(assignment.id);
      }),
    );

    // Invalidate permission cache for the user
    await this.permissionCacheService.invalidateUserPermissions(userId);
  }

  private async mapUserAssignmentDto({
    group,
    user,
  }: {
    group: number;
    user: number;
  }): Promise<{
    group: UserGroup;
    user: User;
  }> {
    const groupEntity = await this.userGroupService.findById(group);
    if (!groupEntity)
      throw new UnprocessableEntityException('Group does not exist!');

    const userEntity = await this.userService.findById(user);
    if (!userEntity)
      throw new UnprocessableEntityException('User does not exist!');

    return { group: groupEntity, user: userEntity };
  }

  async getUserGroupsFromAssignments(userId: number): Promise<string[]> {
    return await this.userRepository.getUserGroupsFromAssignments(userId);
  }
}
