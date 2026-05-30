import { ApprovalsService } from './approvals.service';
import { User } from '@/users/domain/user';
import { Role } from '@/roles/domain/role';
import { Permission } from '@/permissions/domain/permission';

function buildPermission(code: string): Permission {
  return {
    id: code.length,
    code,
    resource: code.split(':')[0],
    action: code.split(':')[1],
    description: null,
    created_at: new Date('2026-05-25'),
    updated_at: new Date('2026-05-25'),
  };
}

function buildUser(overrides: Partial<User> & { permission_codes?: string[] }): User {
  const { permission_codes = [], ...rest } = overrides;
  const role: Role = {
    id: 1,
    name: 'TEST',
    description: null,
    permissions: permission_codes.map(buildPermission),
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: new Date('2026-05-25'),
    updated_at: new Date('2026-05-25'),
    deleted_at: null,
  };
  return {
    id: 1,
    email: 'test@asima.test',
    first_name: 'Test',
    last_name: 'User',
    title: null,
    role,
    role_id: 1,
    system_admin: false,
    is_active: true,
    last_login_at: null,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: new Date('2026-05-25'),
    updated_at: new Date('2026-05-25'),
    deleted_at: null,
    ...rest,
  };
}

describe('ApprovalsService', () => {
  let service: ApprovalsService;

  beforeEach(() => {
    service = new ApprovalsService();
  });

  describe('canSeeAll', () => {
    it('returns true when system_admin is set', () => {
      const user = buildUser({ system_admin: true });
      expect(service.canSeeAll(user)).toBe(true);
    });

    it('returns true when role has APPROVAL:ApproveAny among other codes', () => {
      const user = buildUser({
        permission_codes: ['APPROVAL:View', 'APPROVAL:ApproveAny'],
      });
      expect(service.canSeeAll(user)).toBe(true);
    });

    it('returns true when APPROVAL:ApproveAny is the only code', () => {
      const user = buildUser({ permission_codes: ['APPROVAL:ApproveAny'] });
      expect(service.canSeeAll(user)).toBe(true);
    });

    it('returns false when neither system_admin nor APPROVAL:ApproveAny present', () => {
      const user = buildUser({ permission_codes: ['APPROVAL:View'] });
      expect(service.canSeeAll(user)).toBe(false);
    });

    it('returns false with an empty permission list', () => {
      const user = buildUser({ permission_codes: [] });
      expect(service.canSeeAll(user)).toBe(false);
    });
  });

  describe('findPending', () => {
    it('returns an empty paginated payload using defaults when query is empty', async () => {
      const user = buildUser({ permission_codes: ['APPROVAL:View'] });
      const result = await service.findPending(user, {});
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        has_more: false,
      });
    });

    it('echoes provided pagination values', async () => {
      const user = buildUser({ permission_codes: ['APPROVAL:View'] });
      const result = await service.findPending(user, { page: 3, limit: 5 });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.data).toEqual([]);
      expect(result.has_more).toBe(false);
    });

    it('clamps limit to maxLimit (100)', async () => {
      const user = buildUser({ permission_codes: ['APPROVAL:View'] });
      const result = await service.findPending(user, { limit: 500 });
      expect(result.limit).toBe(100);
    });

    it('returns empty for system_admin (canSeeAll branch)', async () => {
      const user = buildUser({ system_admin: true });
      const result = await service.findPending(user, {});
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns empty for HR override (APPROVAL:ApproveAny branch)', async () => {
      const user = buildUser({
        permission_codes: ['APPROVAL:View', 'APPROVAL:ApproveAny'],
      });
      const result = await service.findPending(user, {});
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
