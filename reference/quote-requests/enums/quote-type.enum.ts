/**
 * Quote type enumeration.
 *
 * Distinguishes between pre-booking quotes and post-assessment quotations.
 *
 * @version 1
 * @since 1.0.0
 */
export enum QuoteTypeEnum {
  /**
   * Pre-booking quote request.
   * Customer requests a quote before booking a service.
   * Standard flow for requires_quote services.
   */
  PRE_BOOKING = 'pre_booking',

  /**
   * Post-assessment quotation.
   * Provider creates a detailed quotation after completing an assessment booking.
   * Contains itemized services and materials with pricing.
   * Part of the DPO (Diagnose, Propose, Order) flow.
   */
  POST_ASSESSMENT = 'post_assessment',
}
