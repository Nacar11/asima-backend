import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserPermission } from './domain/user-permission';
import { UserPermissionsService } from './user-permissions.service';
import { PermissionCacheService } from '../permissions/permission-cache.service';
import { PERMISSION_HIERARCHY } from '../permissions/permission.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  /**
   * Usage:
   *   Add the Permissions decorator to one of your API endpoints in the Controller.
   *   This guard allows multiple menu codes, and permissions to be a single permission or an array of permissions.
   *
   * Ex.
   * ...
   * @UseGuards(PermissionsGuard)
   * @Permissions({ CC01: ['View', 'Delete'], CC02: 'Edit' })
   * ...
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const permissions = this.reflector.getAllAndOverride<UserPermission>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // permit access to resource to system admins
    if (user.system_admin) {
      return true;
    }

    // If no permissions are required for this endpoint, allow access
    // (the endpoint is still protected by JWT auth guard)
    if (!permissions) {
      return true;
    }

    // Try to get permissions from cache first
    const cachedPermissions =
      await this.permissionCacheService.getUserPermissions(user.id);

    if (cachedPermissions) {
      // Use cached permissions
      return this.matchPermissionsFromCache(permissions, cachedPermissions);
    }

    // Cache miss - compute permissions from database
    // Reuse the user object from JWT strategy (already has assignments + group loaded)
    if (!user?.assignments) {
      return false;
    }

    // Get user's group names and IDs (only Active assignments)
    const userGroups = user.assignments
      .filter((assignment) => assignment?.status === 'Active')
      .map((assignment) => ({
        id: assignment?.group?.id,
        name: assignment?.group?.group_name,
      }));

    // Get all group IDs (including inherited)
    // Note: We need to fetch inherited groups from DB if they weren't assigned directly
    const directGroupIds = userGroups
      .filter((g) => g.id)
      .map((g) => g.id as number);

    // Get permissions for all groups
    const userPermissions =
      await this.userPermissionsService.getUserGroupPermissions(directGroupIds);

    // Build permission map for caching
    const permissionMap = this.buildPermissionMap(userPermissions);

    // Cache the computed permissions
    await this.permissionCacheService.setUserPermissions(
      user.id,
      permissionMap,
    );

    // Check if user has required permissions
    const hasPermission = this.userPermissionsService.matchUserPermission(
      permissions,
      userPermissions,
    );

    return hasPermission;
  }

  /**
   * Resolve group hierarchy - get all inherited group names
   */
  private resolveGroupHierarchy(groupNames: string[]): string[] {
    const resolved = new Set<string>(groupNames);

    for (const groupName of groupNames) {
      const inheritedGroups = PERMISSION_HIERARCHY[groupName] || [];
      for (const inherited of inheritedGroups) {
        resolved.add(inherited);
        // Recursively resolve deeper inheritance
        const deepInherited = this.resolveGroupHierarchy([inherited]);
        deepInherited.forEach((g) => resolved.add(g));
      }
    }

    return Array.from(resolved);
  }

  /**
   * Build a permission map from user permission entities for caching
   */
  private buildPermissionMap(
    userPermissions: UserPermission[],
  ): Record<string, string[]> {
    const permissionMap: Record<string, string[]> = {};

    for (const perm of userPermissions || []) {
      const menuCode = perm.menu?.menu_code;
      if (!menuCode) continue;

      if (!permissionMap[menuCode]) {
        permissionMap[menuCode] = [];
      }

      // Add unique permissions
      for (const p of perm.permissions || []) {
        if (!permissionMap[menuCode].includes(p)) {
          permissionMap[menuCode].push(p);
        }
      }
    }

    return permissionMap;
  }

  /**
   * Match permissions using cached permission map
   */
  private matchPermissionsFromCache(
    requiredPermissions: UserPermission | UserPermission[],
    cachedPermissions: Record<string, string[]>,
  ): boolean {
    // Handle array format from decorator (spread operator creates array)
    const permissionsToCheck = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    for (const permissionObj of permissionsToCheck) {
      for (const [menuCode, requiredPerms] of Object.entries(permissionObj)) {
        const userPerms = cachedPermissions[menuCode] || [];

        // Convert to array if single string
        const requiredArray = Array.isArray(requiredPerms)
          ? requiredPerms
          : [requiredPerms];

        // Check if user has at least one of the required permissions
        const hasAnyPermission = requiredArray.some((perm) =>
          userPerms.includes(perm),
        );

        if (hasAnyPermission) {
          return true;
        }
      }
    }

    return false;
  }
}
