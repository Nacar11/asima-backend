import { Injectable } from '@nestjs/common';
import { notFound } from '@/utils/helpers/http-errors';
import { BasePermissionRepository } from '@/permissions/persistence/base-permission.repository';
import { Permission } from '@/permissions/domain/permission';
import { PermissionSearchCriteria } from '@/permissions/domain/permission-search-criteria';
import { FindAllPermission } from '@/permissions/domain/find-all-permission';

@Injectable()
export class PermissionsService {
  constructor(private readonly repository: BasePermissionRepository) {}

  findAll(criteria: PermissionSearchCriteria): Promise<FindAllPermission> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<Permission> {
    const permission = await this.repository.findById(id);
    if (!permission) {
      throw notFound('Permission', id);
    }
    return permission;
  }

  findByCodes(codes: string[]): Promise<Permission[]> {
    return this.repository.findByCodes(codes);
  }

  async update(id: number, patch: { description?: string | null }): Promise<Permission> {
    await this.findById(id);
    return this.repository.update(id, patch);
  }
}
