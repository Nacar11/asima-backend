import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { CreateStoreUserGroupDto } from './dto/create-store-user-group.dto';
import { UpdateStoreUserGroupDto } from './dto/update-store-user-group.dto';
import { JwtPayloadType } from '@/auth/strategies/types/jwt-payload.type';
import { PermissionCacheService } from '@/permissions/permission-cache.service';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';
import { TypeOrmStrategy } from '@/devextreme/strategies/type-orm.strategy';

@Injectable()
export class StoreUserGroupsService {
  constructor(
    @InjectRepository(UserGroupEntity)
    private userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserPermissionEntity)
    private userPermissionRepository: Repository<UserPermissionEntity>,
    @InjectRepository(UserAssignmentEntity)
    private userAssignmentRepository: Repository<UserAssignmentEntity>,
    @InjectRepository(UserSellerAssignmentEntity)
    private userSellerAssignmentRepository: Repository<UserSellerAssignmentEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
    private permissionCacheService: PermissionCacheService,
  ) {}

  private async validateStoreAccess(
    currentUser: JwtPayloadType,
  ): Promise<{ seller: SellerEntity; isOwner: boolean }> {
    if (!currentUser.seller_id) {
      throw new ForbiddenException('No store found');
    }

    const seller = await this.sellerRepository.findOne({
      where: { id: currentUser.seller_id },
    });

    if (!seller) {
      throw new ForbiddenException('No store found');
    }

    const isOwner = seller.user_id === currentUser.id;

    return { seller, isOwner };
  }

  private async getOwnerPermissions(
    ownerId: number,
  ): Promise<Map<number, string[]>> {
    const ownerAssignments = await this.userAssignmentRepository.find({
      where: { user: { id: ownerId }, status: 'Active' },
      relations: ['group'],
    });

    const adminGroupIds = ownerAssignments
      .filter((a) => a.group && a.group.seller_id === null)
      .map((a) => a.group.id);

    if (adminGroupIds.length === 0) return new Map();

    const permissions = await this.userPermissionRepository.find({
      where: { group: { id: In(adminGroupIds) }, status: 'Active' },
      relations: ['menu'],
    });

    const permissionMap = new Map<number, string[]>();
    permissions.forEach((p) => {
      const existing = permissionMap.get(p.menu.id) || [];
      permissionMap.set(p.menu.id, [
        ...new Set([...existing, ...p.permissions]),
      ]);
    });

    return permissionMap;
  }

  private async getMemberStorePermissions(
    memberId: number,
    sellerId: number,
  ): Promise<Map<number, string[]>> {
    const memberAssignments = await this.userAssignmentRepository.find({
      where: { user: { id: memberId }, status: 'Active' },
      relations: ['group'],
    });

    const storeGroupIds = memberAssignments
      .filter((a) => a.group && a.group.seller_id === sellerId)
      .map((a) => a.group.id);

    if (storeGroupIds.length === 0) return new Map();

    const permissions = await this.userPermissionRepository.find({
      where: { group: { id: In(storeGroupIds) }, status: 'Active' },
      relations: ['menu'],
    });

    const permissionMap = new Map<number, string[]>();
    permissions.forEach((p) => {
      const existing = permissionMap.get(p.menu.id) || [];
      permissionMap.set(p.menu.id, [
        ...new Set([...existing, ...p.permissions]),
      ]);
    });

    return permissionMap;
  }

  private async getStoreOwnerPermissions(
    seller: SellerEntity,
  ): Promise<Map<number, string[]>> {
    return this.getOwnerPermissions(seller.user_id);
  }

  async getAvailableMenus(currentUser: JwtPayloadType) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    const userPermissions = isOwner
      ? await this.getOwnerPermissions(currentUser.id)
      : await this.getMemberStorePermissions(currentUser.id, seller.id);

    if (userPermissions.size === 0) {
      return { data: [] };
    }

    const menuIds = Array.from(userPermissions.keys());
    const menus = await this.menuRepository.find({
      where: { id: In(menuIds), status: 'Active' },
    });

    const data = menus.map((menu) => ({
      id: menu.id,
      menu_code: menu.menu_code,
      menu_name: menu.menu_name,
      permissions: (userPermissions.get(menu.id) || []).filter((p) =>
        menu.permissions.includes(p),
      ),
    }));

    return { data };
  }

  private validatePermissionsSubset(
    requestedMenus: { menu_id: number; permissions: string[] }[],
    ownerPermissions: Map<number, string[]>,
  ): void {
    for (const menu of requestedMenus) {
      const ownerPerms = ownerPermissions.get(menu.menu_id);

      if (!ownerPerms) {
        throw new BadRequestException(
          `You do not have access to menu ${menu.menu_id}`,
        );
      }

      const invalidPerms = menu.permissions.filter(
        (p) => !ownerPerms.includes(p),
      );
      if (invalidPerms.length > 0) {
        throw new BadRequestException(
          `You cannot assign permissions [${invalidPerms.join(', ')}] for menu ${menu.menu_id}`,
        );
      }
    }
  }

  private async pruneExcessPermissions(
    groups: UserGroupEntity[],
    ownerPermissions: Map<number, string[]>,
  ): Promise<number[]> {
    const affectedGroupIds: Set<number> = new Set();

    for (const group of groups) {
      if (!group.user_permissions) continue;

      for (const perm of group.user_permissions) {
        const ownerPerms = ownerPermissions.get(perm.menu.id);

        if (!ownerPerms) {
          // Owner no longer has access to this menu — delete the record
          await this.userPermissionRepository.delete({ id: perm.id });
          group.user_permissions = group.user_permissions.filter(
            (p) => p.id !== perm.id,
          );
          affectedGroupIds.add(group.id);
          continue;
        }

        const validPerms = perm.permissions.filter((p) =>
          ownerPerms.includes(p),
        );

        if (validPerms.length === 0) {
          // All permissions for this menu are now invalid — delete record
          await this.userPermissionRepository.delete({ id: perm.id });
          group.user_permissions = group.user_permissions.filter(
            (p) => p.id !== perm.id,
          );
          affectedGroupIds.add(group.id);
        } else if (validPerms.length < perm.permissions.length) {
          // Some permissions were removed — update with only valid ones
          perm.permissions = validPerms;
          await this.userPermissionRepository.save(perm);
          affectedGroupIds.add(group.id);
        }
      }
    }

    return Array.from(affectedGroupIds);
  }

  private async validateMemberBelongsToStore(
    userId: number,
    sellerId: number,
  ): Promise<void> {
    const assignment = await this.userSellerAssignmentRepository.findOne({
      where: {
        user: { id: userId },
        seller: { id: sellerId },
        status: 'Active' as any,
      },
    });

    if (!assignment) {
      throw new BadRequestException(
        'User must have store membership before group assignment',
      );
    }
  }

  private async validateMemberNotOwner(
    userId: number,
    sellerId: number,
  ): Promise<void> {
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, user_id: userId },
    });

    if (seller) {
      throw new BadRequestException('Store owner cannot be assigned as staff');
    }
  }

  async create(dto: CreateStoreUserGroupDto, currentUser: JwtPayloadType) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store user groups',
      );
    }

    const userPermissions = await this.getOwnerPermissions(currentUser.id);

    if (dto.menus?.length) {
      this.validatePermissionsSubset(dto.menus, userPermissions);
    }

    if (dto.members?.length) {
      for (const member of dto.members) {
        await this.validateMemberNotOwner(member.user_id, seller.id);
        await this.validateMemberBelongsToStore(member.user_id, seller.id);
      }
    }

    const userGroup = this.userGroupRepository.create({
      seller_id: seller.id,
      group_name: dto.group_name,
      description: dto.description,
      created_by: { id: currentUser.id } as any,
      updated_by: { id: currentUser.id } as any,
    });

    const savedGroup = await this.userGroupRepository.save(userGroup);

    if (dto.menus?.length) {
      const permissions = dto.menus.map((menu) =>
        this.userPermissionRepository.create({
          group: savedGroup as any,
          menu: { id: menu.menu_id } as any,
          permissions: menu.permissions,
          created_by: { id: currentUser.id } as any,
          updated_by: { id: currentUser.id } as any,
        }),
      );
      await this.userPermissionRepository.save(permissions);
    }

    if (dto.members?.length) {
      const assignments = dto.members.map((member) =>
        this.userAssignmentRepository.create({
          user: { id: member.user_id } as any,
          group: savedGroup as any,
          created_by: { id: currentUser.id } as any,
          updated_by: { id: currentUser.id } as any,
        }),
      );
      await this.userAssignmentRepository.save(assignments);

      // Invalidate cache for all members assigned to this new group
      const memberIds = dto.members.map((m) => m.user_id);
      await this.permissionCacheService.invalidateMultipleUserPermissions(
        memberIds,
      );
    }

    return savedGroup;
  }

  async findAllForStore(currentUser: JwtPayloadType, query?: BaseGetDto) {
    const { seller } = await this.validateStoreAccess(currentUser);

    const strategy = new TypeOrmStrategy();
    const { where } = strategy.get(query ?? new BaseGetDto());

    const filterConditions =
      Array.isArray(where) && where.length > 0 ? where : [{}];
    const isCancelledFilter = filterConditions.some(
      (c: any) => c.status === 'Cancelled',
    );

    const extraWhere = filterConditions.map((condition: any) => ({
      ...condition,
      seller_id: seller.id,
      // Only include soft-deleted records when filtering by Cancelled
      deleted_at: isCancelledFilter ? Not(IsNull()) : IsNull(),
    }));

    const groups = await this.userGroupRepository.find({
      where: extraWhere,
      withDeleted: true,
      relations: [
        'user_assignments',
        'user_assignments.user',
        'user_permissions',
        'user_permissions.menu',
      ],
    });

    const ownerPermissions = await this.getStoreOwnerPermissions(seller);
    const affectedGroupIds = await this.pruneExcessPermissions(
      groups,
      ownerPermissions,
    );

    // Invalidate cache for users in groups whose permissions were pruned
    for (const groupId of affectedGroupIds) {
      await this.invalidateGroupMembersCache(groupId);
    }

    return groups;
  }

  async findOne(id: number, currentUser: JwtPayloadType) {
    const { seller } = await this.validateStoreAccess(currentUser);

    const group = await this.userGroupRepository.findOne({
      where: { id, seller_id: seller.id },
      relations: [
        'user_assignments',
        'user_assignments.user',
        'user_permissions',
        'user_permissions.menu',
      ],
    });

    if (!group) {
      throw new BadRequestException('Store user group not found');
    }

    const ownerPermissions = await this.getStoreOwnerPermissions(seller);
    const affectedGroupIds = await this.pruneExcessPermissions(
      [group],
      ownerPermissions,
    );

    if (affectedGroupIds.length > 0) {
      await this.invalidateGroupMembersCache(group.id);
    }

    return group;
  }

  async update(
    id: number,
    dto: UpdateStoreUserGroupDto,
    currentUser: JwtPayloadType,
  ) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store user groups',
      );
    }

    const userPermissions = await this.getOwnerPermissions(currentUser.id);

    const group = await this.userGroupRepository.findOne({
      where: { id, seller_id: seller.id },
    });

    if (!group) {
      throw new BadRequestException('Store user group not found');
    }

    if (dto.menus?.length) {
      this.validatePermissionsSubset(dto.menus, userPermissions);

      await this.userPermissionRepository.delete({ group: { id } });

      const permissions = dto.menus.map((menu) =>
        this.userPermissionRepository.create({
          group: { id } as any,
          menu: { id: menu.menu_id } as any,
          permissions: menu.permissions,
          created_by: { id: currentUser.id } as any,
          updated_by: { id: currentUser.id } as any,
        }),
      );
      await this.userPermissionRepository.save(permissions);
    }

    if (dto.members?.length) {
      for (const member of dto.members) {
        await this.validateMemberNotOwner(member.user_id, seller.id);
        await this.validateMemberBelongsToStore(member.user_id, seller.id);
      }

      await this.userAssignmentRepository.delete({ group: { id } });

      const assignments = dto.members.map((member) =>
        this.userAssignmentRepository.create({
          user: { id: member.user_id } as any,
          group: { id } as any,
          created_by: { id: currentUser.id } as any,
          updated_by: { id: currentUser.id } as any,
        }),
      );
      await this.userAssignmentRepository.save(assignments);
    }

    if (dto.group_name) group.group_name = dto.group_name;
    if (dto.description !== undefined) group.description = dto.description;

    const result = await this.userGroupRepository.save(group);

    // Invalidate permission cache for all users in this group
    if (dto.menus?.length || dto.members?.length) {
      await this.invalidateGroupMembersCache(id);
    }

    return result;
  }

  private async invalidateGroupMembersCache(groupId: number): Promise<void> {
    const assignments = await this.userAssignmentRepository.find({
      where: { group: { id: groupId }, status: 'Active' },
      relations: ['user'],
    });

    const userIds = assignments.filter((a) => a.user?.id).map((a) => a.user.id);

    if (userIds.length > 0) {
      await this.permissionCacheService.invalidateMultipleUserPermissions(
        userIds,
      );
    }
  }

  async restore(id: number, currentUser: JwtPayloadType) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store user groups',
      );
    }

    const group = await this.userGroupRepository.findOne({
      where: { id, seller_id: seller.id },
      withDeleted: true,
    });

    if (!group) {
      throw new BadRequestException('Store user group not found');
    }

    if (group.status !== 'Cancelled') {
      throw new BadRequestException('Only cancelled groups can be restored');
    }

    group.status = 'Active';
    group.deleted_at = null;
    return this.userGroupRepository.save(group);
  }

  async remove(id: number, currentUser: JwtPayloadType) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store user groups',
      );
    }

    const group = await this.userGroupRepository
      .createQueryBuilder('group')
      .select(['group.id', 'group.deleted_at'])
      .where('group.id = :id AND group.seller_id = :sellerId', {
        id,
        sellerId: seller.id,
      })
      .withDeleted()
      .getOne();

    if (!group) {
      throw new BadRequestException('Store user group not found');
    }

    await this.invalidateGroupMembersCache(id);

    if (group.deleted_at) {
      // Second delete: hard delete — use query builder to bypass soft-delete filter
      return this.userGroupRepository
        .createQueryBuilder()
        .delete()
        .from(UserGroupEntity)
        .where('id = :id', { id })
        .execute();
    }

    // First delete: mark Cancelled + set deleted_at in one raw query
    await this.userGroupRepository.manager.query(
      `UPDATE user_groups SET status = $1, deleted_at = NOW() WHERE id = $2`,
      ['Cancelled', id],
    );
  }
}
