/**
 * Base for pure domain errors that pin a violation to a single input `field`
 * and map to a 422. An aggregate / value object throws a subclass (staying
 * framework-free — no `@nestjs/*`); the use-case translates it with
 * `rethrowFieldValidationError`, which renders the app's
 * `{ status: 422, errors: { [field]: message } }` envelope. Carrying `field`
 * on the error is what lets that HTTP mapping be one shared function instead of
 * a per-module `rethrow*DomainError`.
 *
 * Domain errors that map to a DIFFERENT status (e.g. a state-machine conflict →
 * 409) must NOT extend this — they extend `Error` and the use-case maps them
 * explicitly, so `rethrowFieldValidationError` passes them through untouched.
 */
export abstract class FieldValidationError extends Error {
  abstract readonly field: string;
}
