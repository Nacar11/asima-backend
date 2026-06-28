import { FieldValidationError } from '@/utils/domain/field-validation-error';
import { unprocessable } from '@/utils/helpers/http-errors';

/**
 * Translate a pure `FieldValidationError` raised by an aggregate / value object
 * into the app's 422 field envelope; anything else (an HTTP exception the
 * use-case already threw, an I/O error) is rethrown untouched. The single
 * domain→HTTP seam a use-case calls after invoking aggregate behavior — replaces
 * the per-module `rethrow*DomainError` helpers, which were all this shape.
 */
export function rethrowFieldValidationError(err: unknown): never {
  if (err instanceof FieldValidationError) throw unprocessable(err.field, err.message);
  throw err;
}
