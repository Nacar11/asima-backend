import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Required permissions in compact form: `{ RESOURCE: 'Action' }` for one,
 * `{ RESOURCE: ['Action1', 'Action2'] }` for many. The guard expands these
 * to flat `RESOURCE:Action` codes and requires ALL of them (AND semantics).
 *
 * Examples:
 *   @Permissions({ USER: 'Create' })
 *   @Permissions({ USER: ['View', 'Update'] })
 *   @Permissions({ USER: 'View', ROLE: 'View' })
 */
export type RequiredPermissions = Record<string, string | string[]>;

export const Permissions = (required: RequiredPermissions) =>
  SetMetadata(PERMISSIONS_KEY, required);
