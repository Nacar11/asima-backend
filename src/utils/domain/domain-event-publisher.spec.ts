import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { DomainEvent } from '@/utils/domain/domain-event';
import type { EventEmitter2 } from '@nestjs/event-emitter';

class EventOne extends DomainEvent {
  readonly name = 'e.one';
}
class EventTwo extends DomainEvent {
  readonly name = 'e.two';
}

describe('DomainEventPublisher', () => {
  it('emits each event under its own name', () => {
    const emit = jest.fn();
    const publisher = new DomainEventPublisher({ emit } as unknown as EventEmitter2);
    const e1 = new EventOne();
    const e2 = new EventTwo();

    publisher.publish([e1, e2]);

    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenNthCalledWith(1, 'e.one', e1);
    expect(emit).toHaveBeenNthCalledWith(2, 'e.two', e2);
  });

  it('no-ops on an empty event list', () => {
    const emit = jest.fn();
    new DomainEventPublisher({ emit } as unknown as EventEmitter2).publish([]);
    expect(emit).not.toHaveBeenCalled();
  });
});
