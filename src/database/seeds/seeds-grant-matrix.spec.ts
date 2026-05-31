import * as path from 'path';
import * as fs from 'fs';

/**
 * Locks the (role -> permission_codes) seed matrix.
 *
 * The seed services apply whatever is in the JSON; this test is the
 * gate that prevents accidental drift in the JSON itself. If an HR
 * accidentally merges a roles.json change that grants EMPLOYEE the
 * LEAVE:ApproveAny code, this test fails before the PR lands.
 *
 * Runtime role-edits via `/admin/roles/:id/permissions` are NOT
 * covered by this test — they're audit'd by the API. This test only
 * locks the seed defaults a fresh DB lands in.
 */

const SEEDS_DIR = path.join(__dirname, 'data');

type PermissionRow = {
  code: string;
  resource: string;
  action: string;
  description: string;
};

type RoleRow = {
  name: string;
  description: string;
  permission_codes: '*' | string[];
};

function loadPermissions(): PermissionRow[] {
  return JSON.parse(fs.readFileSync(path.join(SEEDS_DIR, 'permissions.json'), 'utf-8'));
}

function loadRoles(): RoleRow[] {
  return JSON.parse(fs.readFileSync(path.join(SEEDS_DIR, 'roles.json'), 'utf-8'));
}

function findRole(name: string): RoleRow {
  const role = loadRoles().find((r) => r.name === name);
  if (!role) throw new Error(`Role '${name}' missing from roles.json`);
  return role;
}

describe('Seed grant matrix', () => {
  describe('permission catalog (data/permissions.json)', () => {
    const perms = loadPermissions();
    const codes = new Set(perms.map((p) => p.code));

    it('includes every legacy code that existing modules depend on', () => {
      const legacy = [
        'USER:Create',
        'USER:View',
        'USER:Update',
        'USER:Delete',
        'ROLE:Create',
        'ROLE:View',
        'ROLE:Update',
        'ROLE:Delete',
        'PERMISSION:View',
        'PERMISSION:Update',
        'TIME:Create',
        'TIME:View',
        'TIME:Update',
        'TIME:Delete',
        'SCHEDULE:Create',
        'SCHEDULE:View',
        'SCHEDULE:Update',
        'SCHEDULE:Delete',
        'APPROVAL:View',
        'APPROVAL:ApproveAny',
      ];
      for (const code of legacy) {
        expect(codes.has(code)).toBe(true);
      }
    });

    it('includes the 16 new LEAVE / TIME_CORRECTION / APPROVAL_CHAIN codes', () => {
      const expected = [
        'LEAVE:Create',
        'LEAVE:ViewOwn',
        'LEAVE:ViewAll',
        'LEAVE:Update',
        'LEAVE:Delete',
        'LEAVE:Approve',
        'LEAVE:ApproveAny',
        'TIME_CORRECTION:Create',
        'TIME_CORRECTION:ViewOwn',
        'TIME_CORRECTION:ViewAll',
        'TIME_CORRECTION:Update',
        'TIME_CORRECTION:Delete',
        'TIME_CORRECTION:Approve',
        'TIME_CORRECTION:ApproveAny',
        'APPROVAL_CHAIN:View',
        'APPROVAL_CHAIN:Update',
      ];
      for (const code of expected) {
        expect(codes.has(code)).toBe(true);
      }
    });

    it('includes the LEAVE_ALLOCATION grant-ledger codes', () => {
      expect(codes.has('LEAVE_ALLOCATION:Create')).toBe(true);
      expect(codes.has('LEAVE_ALLOCATION:View')).toBe(true);
    });

    it('has no duplicate codes', () => {
      const seen = new Map<string, number>();
      for (const p of perms) {
        seen.set(p.code, (seen.get(p.code) ?? 0) + 1);
      }
      const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([code]) => code);
      expect(dupes).toEqual([]);
    });

    it('uses resource:action format and the resource/action fields match the code', () => {
      for (const p of perms) {
        expect(p.code).toBe(`${p.resource}:${p.action}`);
      }
    });
  });

  describe('role grants (data/roles.json)', () => {
    it('SUPER_ADMIN gets the wildcard', () => {
      expect(findRole('SUPER_ADMIN').permission_codes).toBe('*');
    });

    it('HR_ADMIN gets full LEAVE / TIME_CORRECTION admin + ApproveAny + APPROVAL_CHAIN', () => {
      const codes = new Set(findRole('HR_ADMIN').permission_codes as string[]);
      // Legacy that HR already had
      expect(codes.has('USER:Create')).toBe(true);
      expect(codes.has('APPROVAL:ApproveAny')).toBe(true);
      // New LEAVE: ViewAll + ViewOwn + Update + Delete + ApproveAny (NOT Create/Approve — HR doesn't submit or sit on chains)
      expect(codes.has('LEAVE:ViewAll')).toBe(true);
      expect(codes.has('LEAVE:ViewOwn')).toBe(true);
      expect(codes.has('LEAVE:Update')).toBe(true);
      expect(codes.has('LEAVE:Delete')).toBe(true);
      expect(codes.has('LEAVE:ApproveAny')).toBe(true);
      // New TIME_CORRECTION: same shape
      expect(codes.has('TIME_CORRECTION:ViewAll')).toBe(true);
      expect(codes.has('TIME_CORRECTION:ViewOwn')).toBe(true);
      expect(codes.has('TIME_CORRECTION:Update')).toBe(true);
      expect(codes.has('TIME_CORRECTION:Delete')).toBe(true);
      expect(codes.has('TIME_CORRECTION:ApproveAny')).toBe(true);
      // APPROVAL_CHAIN: both
      expect(codes.has('APPROVAL_CHAIN:View')).toBe(true);
      expect(codes.has('APPROVAL_CHAIN:Update')).toBe(true);
      // LEAVE_ALLOCATION: grant + view balances/history
      expect(codes.has('LEAVE_ALLOCATION:Create')).toBe(true);
      expect(codes.has('LEAVE_ALLOCATION:View')).toBe(true);
    });

    it('HR_ADMIN does NOT have LEAVE:Approve or LEAVE:Create (they use ApproveAny, never submit)', () => {
      const codes = new Set(findRole('HR_ADMIN').permission_codes as string[]);
      expect(codes.has('LEAVE:Approve')).toBe(false);
      expect(codes.has('LEAVE:Create')).toBe(false);
      expect(codes.has('TIME_CORRECTION:Approve')).toBe(false);
      expect(codes.has('TIME_CORRECTION:Create')).toBe(false);
    });

    it('PROJECT_MANAGER gets Approve + ViewOwn for both LEAVE and TIME_CORRECTION (no ApproveAny, no admin)', () => {
      const codes = new Set(findRole('PROJECT_MANAGER').permission_codes as string[]);
      expect(codes.has('LEAVE:Approve')).toBe(true);
      expect(codes.has('LEAVE:ViewOwn')).toBe(true);
      expect(codes.has('TIME_CORRECTION:Approve')).toBe(true);
      expect(codes.has('TIME_CORRECTION:ViewOwn')).toBe(true);
      // Must NOT have any admin / override codes
      expect(codes.has('LEAVE:ApproveAny')).toBe(false);
      expect(codes.has('LEAVE:ViewAll')).toBe(false);
      expect(codes.has('LEAVE:Update')).toBe(false);
      expect(codes.has('LEAVE:Delete')).toBe(false);
      expect(codes.has('APPROVAL_CHAIN:Update')).toBe(false);
    });

    it('TECHNICAL_DIRECTOR has the identical permission set as PROJECT_MANAGER (chain placement, not role, distinguishes them — ADR 0001)', () => {
      const pm = new Set(findRole('PROJECT_MANAGER').permission_codes as string[]);
      const td = new Set(findRole('TECHNICAL_DIRECTOR').permission_codes as string[]);
      expect([...pm].sort()).toEqual([...td].sort());
    });

    it('EMPLOYEE gets Create + ViewOwn for both LEAVE and TIME_CORRECTION; nothing else from the new catalog', () => {
      const codes = new Set(findRole('EMPLOYEE').permission_codes as string[]);
      expect(codes.has('LEAVE:Create')).toBe(true);
      expect(codes.has('LEAVE:ViewOwn')).toBe(true);
      expect(codes.has('TIME_CORRECTION:Create')).toBe(true);
      expect(codes.has('TIME_CORRECTION:ViewOwn')).toBe(true);
      // Must NOT have any approve / admin codes
      expect(codes.has('LEAVE:Approve')).toBe(false);
      expect(codes.has('LEAVE:ApproveAny')).toBe(false);
      expect(codes.has('LEAVE:ViewAll')).toBe(false);
      expect(codes.has('LEAVE:Update')).toBe(false);
      expect(codes.has('TIME_CORRECTION:Approve')).toBe(false);
      expect(codes.has('APPROVAL_CHAIN:View')).toBe(false);
      expect(codes.has('LEAVE_ALLOCATION:Create')).toBe(false);
      expect(codes.has('LEAVE_ALLOCATION:View')).toBe(false);
    });

    it('OPERATIONS_MANAGER gets NO new LEAVE / TIME_CORRECTION / APPROVAL_CHAIN codes (Q7 2026-05-30)', () => {
      const codes = new Set(findRole('OPERATIONS_MANAGER').permission_codes as string[]);
      for (const code of codes) {
        expect(code.startsWith('LEAVE:')).toBe(false);
        expect(code.startsWith('TIME_CORRECTION:')).toBe(false);
        expect(code.startsWith('APPROVAL_CHAIN:')).toBe(false);
      }
    });

    it('every role description fits the roles.description column (varchar 255)', () => {
      // The seed save fails at the DB layer when the JSON description
      // exceeds the column length. Lock it here so the seed run can't
      // half-commit (some roles inserted, later ones rejected).
      for (const role of loadRoles()) {
        expect(role.description.length).toBeLessThanOrEqual(255);
      }
    });

    it('every code in every role grant exists in the permission catalog (no orphan refs)', () => {
      const catalogCodes = new Set(loadPermissions().map((p) => p.code));
      for (const role of loadRoles()) {
        if (role.permission_codes === '*') continue;
        for (const code of role.permission_codes) {
          expect(catalogCodes.has(code)).toBe(true);
        }
      }
    });
  });
});
