/**
 * Order Status Enum
 * Defines all possible order statuses
 */
export enum OrderStatusEnum {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  RETURN_REQUESTED = 'return_requested',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
}
