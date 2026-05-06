/**
 * Payment refund disbursement method for return requests.
 * Tracks HOW the refund was sent to the customer.
 */
export enum PaymentRefundMethodEnum {
  MAYA = 'maya',
  CASH = 'cash',
  WALLET = 'wallet',
}
