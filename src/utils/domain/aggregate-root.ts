import { DomainEvent } from '@/utils/domain/domain-event';

/**
 * Base class for aggregate roots. Behavior methods record domain events
 * into a private buffer; the use-case drains them with `pullEvents()` and
 * publishes them after the persistence save commits.
 *
 * Pure TS: no `@nestjs/*`, no `typeorm`.
 */
export abstract class AggregateRoot<E extends DomainEvent = DomainEvent> {
  private buffered: E[] = [];

  protected recordEvent(event: E): void {
    this.buffered.push(event);
  }

  /** Returns the buffered events and clears the buffer (drain semantics). */
  pullEvents(): E[] {
    const events = this.buffered;
    this.buffered = [];
    return events;
  }
}
