/** Resource axis values for permission codes. */
export const PERMISSION_RESOURCES = {
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  TIME: 'TIME',
  SCHEDULE: 'SCHEDULE',
  APPROVAL: 'APPROVAL',
  LEAVE: 'LEAVE',
  TIME_CORRECTION: 'TIME_CORRECTION',
  APPROVAL_CHAIN: 'APPROVAL_CHAIN',
  LEAVE_ALLOCATION: 'LEAVE_ALLOCATION',
  COMPENSATION: 'COMPENSATION',
} as const;

/**
 * Action axis values for permission codes.
 *
 * `ViewOwn` / `ViewAll` exist (instead of a single `View`) because leave
 * and time-correction surfaces have BOTH a self-service "see my own"
 * audience and a wider "see everyone" audience. Encoding the scope in
 * the code itself eliminates the "did the service forget to scope this
 * query?" failure mode — see ADR 0001 and the 2026-05-30 plan §2.2.
 */
export const PERMISSION_ACTIONS = {
  Create: 'Create',
  View: 'View',
  ViewOwn: 'ViewOwn',
  ViewAll: 'ViewAll',
  Update: 'Update',
  Delete: 'Delete',
  Approve: 'Approve',
  ApproveAny: 'ApproveAny',
} as const;
