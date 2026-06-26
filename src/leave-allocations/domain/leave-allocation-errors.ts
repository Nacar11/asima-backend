/**
 * Pure domain error raised when constructing the leave-allocation amount value
 * object or running the creation guard. The domain stays framework-free (no
 * `@nestjs/*`); the use-case maps it to the HTTP envelope:
 *
 *   InvalidAllocationAmountError → unprocessable('amount', message)  422
 */

/** Amount is not a positive whole number of days. */
export class InvalidAllocationAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAllocationAmountError';
  }
}
