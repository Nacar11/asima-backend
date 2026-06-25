/**
 * A domain event — an immutable fact that already happened, named in the
 * past tense (`leave.approved`). Carries IDs, never whole aggregates.
 *
 * Aggregates record events; the use-case publishes them after the save
 * commits. Pure TS: no `@nestjs/*`, no `typeorm`.
 */
export abstract class DomainEvent {
  /** Stable event name for the publisher, e.g. `leave.approved`. */
  abstract readonly name: string;

  readonly occurred_at: Date;

  constructor(occurred_at: Date = new Date()) {
    this.occurred_at = occurred_at;
  }
}
