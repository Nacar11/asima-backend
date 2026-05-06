/**
 * Shipment Status Enum
 * Defines all possible shipment statuses for delivery tracking
 */
export enum ShipmentStatusEnum {
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERY_EXCEPTION = 'delivery_exception',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
}
