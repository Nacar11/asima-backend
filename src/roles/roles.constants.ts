/**
 * Built-in role names. Full taxonomy documented in
 * `docs/adr/0001-roles-and-approval-design.md`. Role drives permission
 * gating; per-employee approval routing lives in a separate chain (lands
 * with the leave module).
 */
export const ROLE_NAMES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  TECHNICAL_DIRECTOR: 'TECHNICAL_DIRECTOR',
  EMPLOYEE: 'EMPLOYEE',
} as const;

/** Role names that the API may not delete (server-side guard). */
export const PROTECTED_ROLES: ReadonlyArray<string> = [
  ROLE_NAMES.SUPER_ADMIN,
  ROLE_NAMES.HR_ADMIN,
  ROLE_NAMES.OPERATIONS_MANAGER,
  ROLE_NAMES.PROJECT_MANAGER,
  ROLE_NAMES.TECHNICAL_DIRECTOR,
  ROLE_NAMES.EMPLOYEE,
];
