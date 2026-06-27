/**
 * Pure domain errors raised by the `TimeCorrectionRequest` aggregate and its
 * value objects. The aggregate stays framework-free (no `@nestjs/*`); the
 * use-case maps each of these to the exact HTTP exception the service threw
 * before the DDD migration (decision #8), so the wire contract is unchanged:
 *
 *   CorrectionStatusError      → conflict('status', message)            409
 *   NotCurrentApproverError    → forbidden('approver', message)         403
 *   RejectionNoteRequiredError → unprocessable('decision_note', …)      422
 *   NotAllowedToCancelError    → new ForbiddenException(message)        403 plain
 *   InvalidProposedWindowError → unprocessable('proposed_time_out', …)  422
 *   NewLogContractError        → unprocessable(err.field, message)      422
 */

/** Illegal state transition — the request is not in a pending state. */
export class CorrectionStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorrectionStatusError';
  }
}

/** Caller is not the snapshotted approver for the current step. */
export class NotCurrentApproverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotCurrentApproverError';
  }
}

/** A rejection was attempted without a note. */
export class RejectionNoteRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RejectionNoteRequiredError';
  }
}

/** Caller is neither the owner nor an HR holder allowed to cancel. */
export class NotAllowedToCancelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotAllowedToCancelError';
  }
}

/** `proposed_time_out` is not strictly after `proposed_time_in`. */
export class InvalidProposedWindowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProposedWindowError';
  }
}

/**
 * The new-log ("Add Logs") contract was violated. `field` discriminates which
 * 422 envelope key the use-case maps to: `proposed_time_out` when the out time
 * is missing, `work_date` when the date is in the future.
 */
export class NewLogContractError extends Error {
  constructor(
    readonly field: 'proposed_time_out' | 'work_date',
    message: string,
  ) {
    super(message);
    this.name = 'NewLogContractError';
  }
}
