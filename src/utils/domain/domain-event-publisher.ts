import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@/utils/domain/domain-event';

/**
 * Publishes the domain events an aggregate buffered, after the use-case has
 * committed its persistence change. Each event is emitted under its own
 * `name` so subscribers can `@OnEvent('leave.approved')`. Lives in the
 * application/infrastructure seam — NOT in the domain (it imports
 * `@nestjs/*`); aggregates only ever *record* events, never publish them.
 */
@Injectable()
export class DomainEventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(events: DomainEvent[]): void {
    for (const event of events) {
      this.emitter.emit(event.name, event);
    }
  }
}
