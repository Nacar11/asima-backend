import { Role } from '@/roles/domain/role';
import { RoleSearchCriteria } from '@/roles/domain/role-search-criteria';
import { FindAllRole } from '@/roles/domain/find-all-role';

export abstract class BaseRoleRepository {
  abstract findAll(criteria: RoleSearchCriteria): Promise<FindAllRole>;

  abstract findById(id: number): Promise<Role | null>;

  abstract findByName(name: string): Promise<Role | null>;

  abstract create(input: {
    name: string;
    description?: string | null;
    permission_ids: number[];
    created_by?: number | null;
  }): Promise<Role>;

  abstract update(
    id: number,
    patch: { name?: string; description?: string | null; updated_by?: number | null },
  ): Promise<Role>;

  abstract setPermissions(roleId: number, permissionIds: number[]): Promise<Role>;

  abstract softDelete(id: number, deletedBy: number | null): Promise<void>;
}
