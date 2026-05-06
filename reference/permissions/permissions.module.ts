import { Global, Module } from '@nestjs/common';
import { RedisHelper } from '../utils/helpers/redis.helper';
import { PermissionCacheService } from './permission-cache.service';
import { ResourceFilterService } from './resource-filter.service';

@Global()
@Module({
  providers: [RedisHelper, PermissionCacheService, ResourceFilterService],
  exports: [PermissionCacheService, ResourceFilterService],
})
export class PermissionsModule {}
