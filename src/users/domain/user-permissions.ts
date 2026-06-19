import { User } from '@/users/domain/user';

/**
 * True if the user's role carries the given `RESOURCE:Action` permission
 * code. The single source of truth for "does this user hold capability X"
 * outside the `PermissionsGuard` — the approval services use it for the
 * service-layer authorization that the guard can't express (e.g.
 * "Approve OR ApproveAny"; see ADR 0001).
 *
 * Pure read over the domain object — no DI, no DB. `system_admin` is a
 * separate axis (an unconditional bypass) and is intentionally NOT folded
 * in here; callers check `user.system_admin` explicitly where it applies.
 */
export function hasPermission(user: User, code: string): boolean {
  return (user.role?.permissions ?? []).some((p) => p.code === code);
}
