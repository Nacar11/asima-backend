/** Resource axis values for permission codes. */
export const PERMISSION_RESOURCES = {
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
} as const;

/** Action axis values for permission codes. */
export const PERMISSION_ACTIONS = {
  Create: 'Create',
  View: 'View',
  Update: 'Update',
  Delete: 'Delete',
} as const;
