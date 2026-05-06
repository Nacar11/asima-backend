import { ShoppingCartItem } from '@/shopping-carts/domain/shopping-cart-item';

/**
 * Abstract repository interface for ShoppingCartItem operations.
 *
 * Defines the contract for shopping cart item data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseShoppingCartItemRepository {
  /**
   * Create a new shopping cart item.
   *
   * @param item - Shopping cart item domain model to create
   * @returns Promise<ShoppingCartItem> - Created item with variant details
   */
  abstract create(item: ShoppingCartItem): Promise<ShoppingCartItem>;

  /**
   * Find a cart item by ID.
   *
   * @param id - The cart item ID
   * @returns Promise<ShoppingCartItem | null> - Item if found, null otherwise
   */
  abstract findById(id: number): Promise<ShoppingCartItem | null>;

  /**
   * Find a cart item by ID with the relations needed by cart page responses.
   *
   * @param id - The cart item ID
   * @returns Promise<ShoppingCartItem | null> - Item if found, null otherwise
   */
  abstract findByIdForCartResponse(
    id: number,
  ): Promise<ShoppingCartItem | null>;

  /**
   * Find a cart item by cart ID and variant ID.
   *
   * Used to check if a variant already exists in the cart before adding.
   *
   * @param cartId - The shopping cart ID
   * @param variantId - The product variant ID
   * @returns Promise<ShoppingCartItem | null> - Item if found, null otherwise
   */
  abstract findByCartAndVariant(
    cartId: number,
    variantId: number,
  ): Promise<ShoppingCartItem | null>;

  /**
   * Find a cart item by cart ID, service ID, package ID, scheduled date, and scheduled time.
   *
   * Used to check if a service with the same scheduling already exists in the cart.
   *
   * @param cartId - The shopping cart ID
   * @param serviceId - The service ID
   * @param packageId - The service package ID (optional)
   * @param scheduledDate - The scheduled date
   * @param scheduledStartTime - The scheduled start time
   * @returns Promise<ShoppingCartItem | null> - Item if found, null otherwise
   */
  abstract findByCartAndService(
    cartId: number,
    serviceId: number,
    packageId: number | null,
    scheduledDate: Date,
    scheduledStartTime: string,
  ): Promise<ShoppingCartItem | null>;

  /**
   * Find all items for a specific cart.
   *
   * @param cartId - The shopping cart ID
   * @returns Promise<ShoppingCartItem[]> - Array of cart items
   */
  abstract findByCartId(cartId: number): Promise<ShoppingCartItem[]>;

  /**
   * Update a shopping cart item.
   *
   * @param id - The cart item ID
   * @param payload - Partial item data to update
   * @returns Promise<ShoppingCartItem> - Updated item with variant details
   */
  abstract update(
    id: number,
    payload: Partial<ShoppingCartItem>,
  ): Promise<ShoppingCartItem>;

  /**
   * Soft delete a shopping cart item.
   *
   * @param id - The cart item ID
   * @returns Promise<void>
   */
  abstract remove(id: number): Promise<void>;

  /**
   * Count total items in a cart (sum of all quantities).
   *
   * @param cartId - The shopping cart ID
   * @returns Promise<number> - Total item count
   */
  abstract countItemsInCart(cartId: number): Promise<number>;

  /**
   * Find multiple cart items by their IDs.
   *
   * @param ids - Array of cart item IDs
   * @returns Promise<ShoppingCartItem[]> - Array of found items
   */
  abstract findByIds(ids: number[]): Promise<ShoppingCartItem[]>;

  /**
   * Bulk update is_selected status for multiple cart items.
   *
   * @param ids - Array of cart item IDs to update
   * @param isSelected - The selection status to set
   * @param userId - The ID of the user performing the update
   * @returns Promise<number> - Number of items updated
   */
  abstract bulkUpdateSelection(
    ids: number[],
    isSelected: boolean,
    userId: number,
  ): Promise<number>;

  /**
   * Bulk soft delete multiple cart items.
   *
   * @param ids - Array of cart item IDs to delete
   * @param userId - The ID of the user performing the deletion
   * @returns Promise<number> - Number of items deleted
   */
  abstract bulkSoftDelete(ids: number[], userId: number): Promise<number>;
}
