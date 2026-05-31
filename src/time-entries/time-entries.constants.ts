/**
 * Source of a time entry — narrowed from the broader schema.dbml vision.
 *
 * Values:
 *   - manual     : self-entered via the toggle-punch endpoint
 *   - biometric  : reserved for future hardware integrations (fingerprint, RFID)
 *   - admin      : created or edited on behalf of an employee by HR
 *   - correction : written by an approved time-correction request
 *                  (TimeEntriesService.applyCorrection — 2026-05-30 plan §10)
 */
export const TIME_ENTRY_SOURCES = {
  manual: 'manual',
  biometric: 'biometric',
  admin: 'admin',
  correction: 'correction',
} as const;

export type TimeEntrySource = (typeof TIME_ENTRY_SOURCES)[keyof typeof TIME_ENTRY_SOURCES];

/**
 * Lifecycle status — also narrowed from schema.dbml.
 *
 * v0 keeps two values:
 *   - open      : time_in recorded, time_out still NULL
 *   - confirmed : segment is closed (both punches recorded)
 *
 * `pending` and `locked` belong to a day-close / payroll cutoff workflow
 * that v0 does not expose endpoints for.
 *
 * The unique partial index `(employee_id) WHERE status='open' AND
 * deleted_at IS NULL` is the database-level seam that prevents an
 * employee from having two open entries at once. Service-layer logic
 * relies on this constraint failing to detect concurrent punches.
 */
export const TIME_ENTRY_STATUSES = {
  open: 'open',
  confirmed: 'confirmed',
} as const;

export type TimeEntryStatus = (typeof TIME_ENTRY_STATUSES)[keyof typeof TIME_ENTRY_STATUSES];
