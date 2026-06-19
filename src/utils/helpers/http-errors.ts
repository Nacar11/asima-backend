import {
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';

/**
 * Builders for the app's per-field error envelope `{ status, errors: {
 * field: message } }`. Every feature service throws validation/conflict
 * errors in this exact shape so the frontend can map them onto form
 * fields — keep the envelope identical here rather than re-declaring a
 * local copy in each service.
 */

/** 422 with `{ status: 422, errors: { [field]: message } }`. */
export function unprocessable(field: string, message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({ status: 422, errors: { [field]: message } });
}

/** 409 with `{ status: 409, errors: { [field]: message } }`. */
export function conflict(field: string, message: string): ConflictException {
  return new ConflictException({ status: 409, errors: { [field]: message } });
}

/** 403 with `{ status: 403, errors: { [field]: message } }`. */
export function forbidden(field: string, message: string): ForbiddenException {
  return new ForbiddenException({ status: 403, errors: { [field]: message } });
}
