/**
 * DragonPay Transaction Status Codes
 * Based on DragonPay Payment Switch API v2.26 (Appendix 3)
 */
export enum DragonPayStatusEnum {
  SUCCESS = 'S', // Payment successful
  FAILURE = 'F', // Payment failed
  PENDING = 'P', // Awaiting payment
  UNKNOWN = 'U', // Still processing
  VOID = 'V', // Transaction voided
  HOLD = 'H', // On hold (payout)
  IN_PROGRESS = 'G', // In progress (payout)
}

/**
 * Status code descriptions for documentation
 */
export const DragonPayStatusDescriptions = {
  [DragonPayStatusEnum.SUCCESS]: 'Success - Payment completed successfully',
  [DragonPayStatusEnum.FAILURE]: 'Failed - Payment was not successful',
  [DragonPayStatusEnum.PENDING]: 'Pending - Awaiting customer payment',
  [DragonPayStatusEnum.UNKNOWN]: 'Unknown - Transaction still processing',
  [DragonPayStatusEnum.VOID]: 'Void - Transaction was voided/cancelled',
  [DragonPayStatusEnum.HOLD]: 'Hold - Payout is on hold',
  [DragonPayStatusEnum.IN_PROGRESS]: 'In Progress - Payout is being processed',
};
