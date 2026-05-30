/** Resource axis values for permission codes. */
export const PERMISSION_RESOURCES = {
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  TIME: 'TIME',
  SCHEDULE: 'SCHEDULE',
  APPROVAL: 'APPROVAL',
} as const;

/** Action axis values for permission codes. */
export const PERMISSION_ACTIONS = {
  Create: 'Create',
  View: 'View',
  Update: 'Update',
  Delete: 'Delete',
  ApproveAny: 'ApproveAny',
} as const;
