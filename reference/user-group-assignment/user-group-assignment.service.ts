import { Injectable } from '@nestjs/common';
import { BaseUserGroupRepository } from '@/user-groups/persistence/base-user-group.repository';
import { BaseUserAssignmentRepository } from '@/user-assignments/persistence/base-user-assignment.repository';
import { PermissionCacheService } from '@/permissions/permission-cache.service';

@Injectable()
export class UserGroupAssignmentService {
  constructor(
    private readonly userGroupRepository: BaseUserGroupRepository,
    private readonly userAssignmentRepository: BaseUserAssignmentRepository,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}
}
