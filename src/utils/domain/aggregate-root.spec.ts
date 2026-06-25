import { AggregateRoot } from '@/utils/domain/aggregate-root';
import { DomainEvent } from '@/utils/domain/domain-event';

class ThingHappened extends DomainEvent {
  readonly name = 'thing.happened';
  constructor(readonly thing_id: number) {
    super();
  }
}

class Thing extends AggregateRoot {
  doThing(id: number): void {
    this.recordEvent(new ThingHappened(id));
  }
}

describe('AggregateRoot', () => {
  it('starts with no buffered events', () => {
    expect(new Thing().pullEvents()).toEqual([]);
  });

  it('buffers recorded events in order', () => {
    const thing = new Thing();
    thing.doThing(1);
    thing.doThing(2);

    const events = thing.pullEvents();
    expect(events).toHaveLength(2);
    expect((events[0] as ThingHappened).thing_id).toBe(1);
    expect((events[1] as ThingHappened).thing_id).toBe(2);
  });

  it('clears the buffer once pulled (events are drained, not copied)', () => {
    const thing = new Thing();
    thing.doThing(1);

    expect(thing.pullEvents()).toHaveLength(1);
    expect(thing.pullEvents()).toEqual([]);
  });

  it('stamps occurred_at and exposes a stable event name', () => {
    const event = new ThingHappened(7);
    expect(event.name).toBe('thing.happened');
    expect(event.occurred_at).toBeInstanceOf(Date);
  });
});
