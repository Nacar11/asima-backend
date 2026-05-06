import { Injectable, ForbiddenException } from '@nestjs/common';
import { User } from '../users/domain/user';
import {
  ResourceFilterType,
  MENU_RESOURCE_FILTER,
} from './permission.constants';

@Injectable()
export class ResourceFilterService {
  /**
   * Get the resource filter criteria for a given menu code and user
   * Returns filter criteria to apply to database queries
   * @param menuCode - The menu code (e.g., 'SM01')
   * @param user - The authenticated user
   * @returns Filter object or null (no filtering needed)
   */
  getResourceFilter(menuCode: string, user: User): Record<string, any> | null {
    // System admins have no filter - they can access all resources
    if (user.system_admin) {
      return null;
    }

    const filterType = MENU_RESOURCE_FILTER[menuCode];

    if (!filterType) {
      // Menu code not in filter map - default to no filtering
      return null;
    }

    switch (filterType) {
      case ResourceFilterType.NONE:
        return null;

      case ResourceFilterType.STORE:
        if (!user.seller_id) {
          throw new ForbiddenException('User is not associated with a store');
        }
        return { seller_id: user.seller_id };

      case ResourceFilterType.CUSTOMER:
        return { customer_id: user.id };

      case ResourceFilterType.STORE_OR_CUSTOMER:
        // Store owners/members see store data, customers see own data
        if (user.seller_id) {
          return { seller_id: user.seller_id };
        }
        return { customer_id: user.id };

      default:
        return null;
    }
  }

  /**
   * Check if user can access a specific resource
   * @param menuCode - The menu code
   * @param user - The authenticated user
   * @param resource - The resource being accessed (must have seller_id or customer_id)
   * @returns true if user can access the resource
   */
  canAccessResource(
    menuCode: string,
    user: User,
    resource: { seller_id?: number | null; customer_id?: number | null },
  ): boolean {
    // System admins can access all resources
    if (user.system_admin) {
      return true;
    }

    const filterType = MENU_RESOURCE_FILTER[menuCode];

    if (!filterType) {
      return true;
    }

    switch (filterType) {
      case ResourceFilterType.NONE:
        return true;

      case ResourceFilterType.STORE:
        return resource.seller_id === user.seller_id;

      case ResourceFilterType.CUSTOMER:
        return resource.customer_id === user.id;

      case ResourceFilterType.STORE_OR_CUSTOMER:
        // User can access if they own the store OR they are the customer
        return (
          resource.seller_id === user.seller_id ||
          resource.customer_id === user.id
        );

      default:
        return true;
    }
  }

  /**
   * Validate resource access and throw ForbiddenException if denied
   * Convenience method that combines canAccessResource with exception throwing
   * @param menuCode - The menu code
   * @param user - The authenticated user
   * @param resource - The resource being accessed
   * @param resourceName - Name for error message (e.g., 'product', 'order')
   */
  validateResourceAccess(
    menuCode: string,
    user: User,
    resource: { seller_id?: number | null; customer_id?: number | null },
    resourceName = 'resource',
  ): void {
    if (!this.canAccessResource(menuCode, user, resource)) {
      throw new ForbiddenException(
        `You do not have access to this ${resourceName}`,
      );
    }
  }

  /**
   * Get the filter type for a menu code
   * @param menuCode - The menu code
   * @returns The resource filter type or undefined
   */
  getFilterType(menuCode: string): ResourceFilterType | undefined {
    return MENU_RESOURCE_FILTER[menuCode];
  }
}
