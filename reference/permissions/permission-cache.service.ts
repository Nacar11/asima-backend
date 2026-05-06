import { Injectable, Logger } from '@nestjs/common';
import { RedisHelper } from '../utils/helpers/redis.helper';
import { PERMISSION_CACHE_CONFIG } from './permission.constants';

@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);

  constructor(private readonly redisHelper: RedisHelper) {}

  /**
   * Get cached permissions for a user
   * @param userId - The user ID
   * @returns Cached permissions map or null if not cached
   */
  async getUserPermissions(
    userId: number,
  ): Promise<Record<string, string[]> | null> {
    const cacheKey = `${PERMISSION_CACHE_CONFIG.PREFIX}${userId}`;

    try {
      const cached = await this.redisHelper.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      this.logger.warn(
        `Failed to get cached permissions for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Cache permissions for a user
   * @param userId - The user ID
   * @param permissions - Map of menu codes to permission arrays
   */
  async setUserPermissions(
    userId: number,
    permissions: Record<string, string[]>,
  ): Promise<void> {
    const cacheKey = `${PERMISSION_CACHE_CONFIG.PREFIX}${userId}`;

    try {
      await this.redisHelper.set(
        cacheKey,
        JSON.stringify(permissions),
        PERMISSION_CACHE_CONFIG.TTL,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to cache permissions for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Invalidate cached permissions for a user
   * @param userId - The user ID
   */
  async invalidateUserPermissions(userId: number): Promise<void> {
    const cacheKey = `${PERMISSION_CACHE_CONFIG.PREFIX}${userId}`;

    try {
      await this.redisHelper.del(cacheKey);
      this.logger.debug(`Invalidated permissions cache for user ${userId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate permissions cache for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Invalidate cached permissions for multiple users
   * @param userIds - Array of user IDs
   */
  async invalidateMultipleUserPermissions(userIds: number[]): Promise<void> {
    for (const userId of userIds) {
      await this.invalidateUserPermissions(userId);
    }
  }

  /**
   * Invalidate all cached permissions (use sparingly)
   */
  async invalidateAllPermissions(): Promise<void> {
    try {
      const pattern = `${PERMISSION_CACHE_CONFIG.PREFIX}*`;
      const deleted = await this.redisHelper.delByPattern(pattern);
      this.logger.log(`Invalidated ${deleted} permission cache entries`);
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate all permissions cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
