/**
 * Checkout source - identifies which platform originated the order.
 * Stored as varchar in the DB for flexibility; this enum provides
 * compile-time safety in backend code.
 */
export enum CheckoutSourceEnum {
  EKUMPRA = 'ekumpra',
  ETRAVAJOE = 'etravajoe',
}
