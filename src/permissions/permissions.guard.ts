import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@/users/domain/user';
import { PERMISSIONS_KEY, RequiredPermissions } from './permissions.decorator';

/**
 * Authorization gate. Pairs with `JwtAuthGuard` — order matters:
 * `@UseGuards(JwtAuthGuard, PermissionsGuard)` so `req.user` is populated
 * by the time this runs.
 *
 *  - No `@Permissions(...)` decorator on the route → pass (auth is enough).
 *  - `req.user.system_admin === true` → pass (ops bypass; ADR 0001).
 *  - Otherwise: every required `RESOURCE:Action` code must be present in
 *    `req.user.role.permissions` (AND-semantics).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermissions | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const req = context.switchToHttp().getRequest<{ user?: User }>();
    const user = req.user;
    if (!user) return false;
    if (user.system_admin === true) return true;

    const have = new Set(user.role?.permissions?.map((p) => p.code) ?? []);
    const need = expand(required);
    return need.every((code) => have.has(code));
  }
}

function expand(required: RequiredPermissions): string[] {
  return Object.entries(required).flatMap(([resource, actions]) =>
    (Array.isArray(actions) ? actions : [actions]).map((action) => `${resource}:${action}`),
  );
}
