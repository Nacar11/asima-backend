import { OrderTrackingEvent } from '@/order-tracking/domain/order-tracking-event';

/**
 * Abstract base repository for Order Tracking Event entities
 * Defines the contract for order tracking data access operations
 */
export abstract class BaseOrderTrackingEventRepository {
  /**
   * Create a new order tracking event
   * @param data Order tracking event domain object
   * @returns Created order tracking event
   */
  abstract create(data: OrderTrackingEvent): Promise<OrderTrackingEvent>;

  /**
   * Find order tracking event by ID
   * @param id Event ID
   * @returns Order tracking event or null if not found
   */
  abstract findById(id: number): Promise<OrderTrackingEvent | null>;

  /**
   * Find all tracking events for an order
   * @param orderId Sales order ID
   * @returns Array of order tracking events sorted by timestamp
   */
  abstract findByOrderId(orderId: number): Promise<OrderTrackingEvent[]>;

  /**
   * Find the latest tracking event for an order
   * @param orderId Sales order ID
   * @returns Latest order tracking event or null
   */
  abstract findLatestByOrderId(
    orderId: number,
  ): Promise<OrderTrackingEvent | null>;
}
