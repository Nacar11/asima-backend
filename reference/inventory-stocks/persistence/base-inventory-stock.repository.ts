import { InventoryStock } from '@/inventory-stocks/domain/inventory-stock';

/**
 * Abstract base repository for Inventory Stock entities
 * Defines the contract for inventory stock data access operations
 */
export abstract class BaseInventoryStockRepository {
  /**
   * Create a new inventory stock
   * @param data Inventory stock domain object
   * @returns Created inventory stock
   */
  abstract create(data: InventoryStock): Promise<InventoryStock>;

  /**
   * Find inventory stock by variant ID
   * @param variantId Product variant ID
   * @returns Inventory stock or null if not found
   */
  abstract findByVariantId(variantId: number): Promise<InventoryStock | null>;

  /**
   * Update inventory stock
   * @param id Inventory stock ID
   * @param data Partial inventory stock domain object
   * @returns Updated inventory stock
   */
  abstract update(
    id: number,
    data: Partial<InventoryStock>,
  ): Promise<InventoryStock>;

  /**
   * Soft delete inventory stock by ID
   * @param id Inventory stock ID
   * @param deletedBy User who is deleting the inventory stock
   * @returns Promise resolving when deletion is complete
   */
  abstract remove(id: number, deletedBy: any): Promise<void>;
}
