/**
 * Pure domain errors raised by the `LeaveRequest` aggregate. The aggregate
 * stays framework-free (no `@nestjs/*`); the use-case maps each of these to
 * the exact HTTP exception the service threw before:
 *
 *   LeaveStatusError          → conflict('status', message)        409 envelope
 *   NotCurrentApproverError   → forbidden('approver', message)     403 envelope
 *   RejectionNoteRequiredError→ unprocessable('decision_note', …)  422 envelope
 *   NotAllowedToCancelError   → new ForbiddenException(message)     403 plain
 */

/** Illegal state transition (wrong lifecycle state, or leave already ended). */
export class LeaveStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeaveStatusError';
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

/**
 * The submit attachment contract was violated — a sick/bereavement request
 * without a file, or any other type carrying one. Maps to
 * unprocessable('attachment', message).
 */
export class AttachmentContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttachmentContractError';
  }
}
