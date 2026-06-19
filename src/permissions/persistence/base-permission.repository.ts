import { Permission } from '@/permissions/domain/permission';
import { PermissionSearchCriteria } from '@/permissions/domain/permission-search-criteria';
import { FindAllPermission } from '@/permissions/domain/find-all-permission';

export abstract class BasePermissionRepository {
  abstract findAll(criteria: PermissionSearchCriteria): Promise<FindAllPermission>;

  abstract findById(id: number): Promise<Permission | null>;

  /**
   * Batch lookup by id. Returns only the rows that exist (missing ids are
   * omitted), in no guaranteed order. Lets callers validate a set of ids
   * in ONE query instead of N — e.g. RolesService checking permission ids.
   */
  abstract findByIds(ids: number[]): Promise<Permission[]>;

  abstract findByCode(code: string): Promise<Permission | null>;

  abstract findByCodes(codes: string[]): Promise<Permission[]>;

  abstract upsertByCode(input: {
    code: string;
    resource: string;
    action: string;
    description: string | null;
  }): Promise<Permission>;

  abstract update(id: number, patch: Partial<Permission>): Promise<Permission>;
}
