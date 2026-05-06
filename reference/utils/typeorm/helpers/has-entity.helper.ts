import { EventType } from '@/utils/typeorm/subscriber/v2/base-entity.subscriber';

/**
 * Type guard function to check if a given event contains an `entity` property.
 *
 * This function helps TypeScript infer a narrower type from a union by determining
 * whether the provided event object has the `entity` property. If so, it asserts
 * that the event is of the type `Extract<EventType<T>, { entity: any }>` — meaning
 * a subtype of `EventType<T>` that includes an `entity` field.
 *
 * @template T - The generic type parameter associated with the event.
 * @param event - The event object to check.
 * @returns `true` if the event is an object and has an `entity` property; otherwise, `false`.
 *
 * @example
 * if (hasEntity(event)) {
 *   // TypeScript now knows event has an `entity` property
 *   console.log(event.entity);
 * }
 */
export function hasEntity<T>(
  event: EventType<T>,
): event is Extract<EventType<T>, { entity: any }> {
  return typeof event === 'object' && event !== null && 'entity' in event;
}
