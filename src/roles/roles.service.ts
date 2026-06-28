import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { notFound, unprocessable } from '@/utils/helpers/http-errors';
import { BaseRoleRepository } from '@/roles/persistence/base-role.repository';
import { BasePermissionRepository } from '@/permissions/persistence/base-permission.repository';
import { Role } from '@/roles/domain/role';
import { RoleSearchCriteria } from '@/roles/domain/role-search-criteria';
import { FindAllRole } from '@/roles/domain/find-all-role';
import { PROTECTED_ROLES } from '@/roles/roles.constants';

@Injectable()
export class RolesService {
  constructor(
    private readonly repository: BaseRoleRepository,
    private readonly permissionRepository: BasePermissionRepository,
  ) {}

  findAll(criteria: RoleSearchCriteria): Promise<FindAllRole> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<Role> {
    const role = await this.repository.findById(id);
    if (!role) throw notFound('Role', id);
    return role;
  }

  findByName(name: string): Promise<Role | null> {
    return this.repository.findByName(name);
  }

  async create(input: {
    name: string;
    description?: string | null;
    permission_ids: number[];
    created_by?: number | null;
  }): Promise<Role> {
    const existing = await this.repository.findByName(input.name);
    if (existing) throw new ConflictException(`Role '${input.name}' already exists`);
    await this.assertPermissionsExist(input.permission_ids);
    return this.repository.create(input);
  }

  async update(
    id: number,
    patch: { name?: string; description?: string | null; updated_by?: number | null },
  ): Promise<Role> {
    const existing = await this.findById(id);
    if (patch.name && patch.name !== existing.name) {
      const conflict = await this.repository.findByName(patch.name);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Role '${patch.name}' already exists`);
      }
    }
    return this.repository.update(id, patch);
  }

  async assignPermissions(roleId: number, permissionIds: number[]): Promise<Role> {
    await this.findById(roleId);
    await this.assertPermissionsExist(permissionIds);
    return this.repository.setPermissions(roleId, permissionIds);
  }

  async softDelete(id: number, deletedBy: number | null): Promise<void> {
    const role = await this.findById(id);
    if (PROTECTED_ROLES.includes(role.name)) {
      throw new ForbiddenException(`Built-in role '${role.name}' cannot be deleted`);
    }
    await this.repository.softDelete(id, deletedBy);
  }

  private async assertPermissionsExist(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const dedup = Array.from(new Set(ids));
    // One batch query (WHERE id IN (...)) instead of one findById per id.
    const found = await this.permissionRepository.findByIds(dedup);
    const foundIds = new Set(found.map((p) => p.id));
    const missing = dedup.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw unprocessable('permission_ids', `Unknown permission ids: ${missing.join(', ')}`);
    }
  }
}
