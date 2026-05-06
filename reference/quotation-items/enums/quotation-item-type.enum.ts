/**
 * Quotation item type enumeration.
 *
 * Distinguishes between service line items and material line items
 * in a post-assessment quotation.
 *
 * @version 1
 * @since 1.0.0
 */
export enum QuotationItemTypeEnum {
  /**
   * Service line item.
   * References a service that will be performed.
   * When accepted, creates a booking for this service.
   */
  SERVICE = 'service',

  /**
   * Material/product line item.
   * References a product/material needed for the work.
   * Added to the order when quotation is accepted.
   */
  MATERIAL = 'material',
}
