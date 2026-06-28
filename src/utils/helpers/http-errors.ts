import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
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

/**
 * 404 with the standard `<Entity> with id <id> not found` message — the one
 * not-found shape every service repeats. A plain message (no field envelope),
 * matching the prior `new NotFoundException(...)` calls verbatim.
 */
export function notFound(entity: string, id: number | string): NotFoundException {
  return new NotFoundException(`${entity} with id ${id} not found`);
}

/**
 * Return `value`, or throw the standard 404 when it is null/undefined — the
 * "load by id or fail" guard every service repeats after a `findById`. Lets a
 * lookup + guard collapse to one expression: `orNotFound(await
 * repo.findById(id), 'Entity', id)`.
 */
export function orNotFound<T>(value: T | null | undefined, entity: string, id: number | string): T {
  if (value == null) throw notFound(entity, id);
  return value;
}
