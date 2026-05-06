/**
 * Listing type enumeration.
 *
 * Distinguishes between marketplace products and internal materials.
 *
 * @version 1
 * @since 1.0.0
 */
export enum ListingTypeEnum {
  /**
   * Marketplace product.
   * Visible to customers on the marketplace for direct purchase.
   */
  PRODUCT = 'product',

  /**
   * Internal material/part.
   * Used by providers for quotations but not visible on marketplace.
   * Added to post-assessment quotations as line items.
   */
  MATERIAL = 'material',
}
