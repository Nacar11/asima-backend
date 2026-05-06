/** Built-in role names. SUPER_ADMIN is the bypass-everything role. */
export const ROLE_NAMES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

/** Role names that the API may not delete (server-side guard). */
export const PROTECTED_ROLES: ReadonlyArray<string> = [
  ROLE_NAMES.SUPER_ADMIN,
  ROLE_NAMES.EMPLOYEE,
];
