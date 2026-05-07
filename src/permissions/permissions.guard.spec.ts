import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY, RequiredPermissions } from './permissions.decorator';

describe('PermissionsGuard', () => {
  let reflector: Reflector;
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function makeContext(user: unknown, required: RequiredPermissions | undefined): ExecutionContext {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => (key === PERMISSIONS_KEY ? required : undefined));
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('passes when no @Permissions metadata is set on the route', () => {
    const ctx = makeContext({ id: 1 }, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when req.user is missing', () => {
    const ctx = makeContext(undefined, { USER: 'View' });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('bypasses for system_admin: true regardless of permissions', () => {
    const ctx = makeContext({ system_admin: true, role: { permissions: [] } }, { USER: 'Create' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('passes when the user holds the required code', () => {
    const ctx = makeContext(
      { system_admin: false, role: { permissions: [{ code: 'USER:View' }] } },
      { USER: 'View' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when the user is missing one of the required codes', () => {
    const ctx = makeContext(
      { system_admin: false, role: { permissions: [{ code: 'USER:View' }] } },
      { USER: ['View', 'Create'] },
    );
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('AND-semantics across multiple resources', () => {
    const ctx = makeContext(
      {
        system_admin: false,
        role: { permissions: [{ code: 'USER:View' }, { code: 'ROLE:View' }] },
      },
      { USER: 'View', ROLE: 'View' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when role.permissions is undefined', () => {
    const ctx = makeContext({ system_admin: false, role: undefined }, { USER: 'View' });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
