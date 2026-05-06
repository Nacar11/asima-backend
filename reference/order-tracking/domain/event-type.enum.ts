/**
 * Order Event Type Enum
 * Defines all possible order tracking event types
 */
export enum OrderEventTypeEnum {
  ORDER_PLACED = 'order_placed',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ORDER_CONFIRMED = 'order_confirmed',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  PICKUP_NO_SHOW = 'pickup_no_show',
  EXCEPTION = 'exception',
  DELIVERY_EXCEPTION = 'delivery_exception',
  REFUND_PROCESSED = 'refund_processed',
  PAYMENT_EXPIRED = 'payment_expired',
  // Return request events
  RETURN_REQUESTED = 'return_requested',
  RETURN_APPROVED = 'return_approved',
  RETURN_REJECTED = 'return_rejected',
  RETURN_PICKUP_SCHEDULED = 'return_pickup_scheduled',
  RETURN_PICKED_UP = 'return_picked_up',
  RETURN_RECEIVED = 'return_received',
  RETURN_REFUNDED = 'return_refunded',
  RETURN_CLOSED = 'return_closed',
}
