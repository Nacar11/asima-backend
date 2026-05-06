import { Injectable } from '@nestjs/common';
import { BaseInventoryStockRepository } from './persistence/base-inventory-stock.repository';
import { InventoryStock } from './domain/inventory-stock';
import { User } from '@/users/domain/user';
import { FeaturedProductsCacheService } from '@/featured-products/featured-products-cache.service';

/**
 * Inventory Stock Service
 * Handles business logic for inventory stock management
 * Note: No controller endpoints - inventory stock is managed internally via product variants
 */
@Injectable()
export class InventoryStocksService {
  constructor(
    private readonly inventoryStockRepository: BaseInventoryStockRepository,
    private readonly featuredProductsCacheService: FeaturedProductsCacheService,
  ) {}

  /**
   * Check if stock is available for a given quantity
   * Purchasable = available_quantity - reserved_quantity
   * @param variantId Product variant ID
   * @param quantity Quantity to check
   * @returns True if available, false otherwise
   */
  async checkAvailability(
    variantId: number,
    quantity: number,
  ): Promise<boolean> {
    const stock =
      await this.inventoryStockRepository.findByVariantId(variantId);

    if (!stock) {
      // No stock record means unlimited availability (or needs to be created)
      return true;
    }

    const purchasable = stock.available_quantity - stock.reserved_quantity;
    return purchasable >= quantity;
  }

  /**
   * Reserve stock for an order
   * Increases reserved_quantity (available_quantity stays the same until shipped)
   * Purchasable decreases: (available_quantity - reserved_quantity)
   * @param variantId Product variant ID
   * @param quantity Quantity to reserve
   * @param causer User making the reservation
   * @returns Updated inventory stock
   */
  async reserveStock(
    variantId: number,
    quantity: number,
    causer: User,
  ): Promise<InventoryStock | null> {
    const stock =
      await this.inventoryStockRepository.findByVariantId(variantId);

    if (!stock) {
      // No stock record - skip reservation
      return null;
    }

    const newReservedQuantity = stock.reserved_quantity + quantity;
    // available_quantity stays the same - only reserved_quantity increases
    // stock_quantity stays the same (stock_on_hand + available_quantity)

    return this.inventoryStockRepository.update(stock.id, {
      reserved_quantity: newReservedQuantity,
      updated_by: causer,
    });
  }

  /**
   * Release reserved stock (e.g., on order cancellation)
   * Decreases reserved_quantity (available_quantity stays the same)
   * Purchasable increases: (available_quantity - reserved_quantity)
   * @param variantId Product variant ID
   * @param quantity Quantity to release
   * @param causer User releasing the reservation
   * @returns Updated inventory stock
   */
  async releaseStock(
    variantId: number,
    quantity: number,
    causer: User,
  ): Promise<InventoryStock | null> {
    const stock =
      await this.inventoryStockRepository.findByVariantId(variantId);

    if (!stock) {
      return null;
    }

    const newReservedQuantity = Math.max(0, stock.reserved_quantity - quantity);
    // available_quantity stays the same - only reserved_quantity decreases
    // stock_quantity stays the same (stock_on_hand + available_quantity)

    return this.inventoryStockRepository.update(stock.id, {
      reserved_quantity: newReservedQuantity,
      updated_by: causer,
    });
  }

  /**
   * Fulfill reserved stock (convert reserved to sold) - called at SHIP time
   * Decreases reserved_quantity, available_quantity, and recalculates stock_quantity
   * stock_on_hand (private stock) is NEVER touched by orders
   * @param variantId Product variant ID
   * @param quantity Quantity to fulfill
   * @param causer User fulfilling the stock
   * @returns Updated inventory stock
   */
  async fulfillStock(
    variantId: number,
    quantity: number,
    causer: User,
  ): Promise<InventoryStock | null> {
    const stock =
      await this.inventoryStockRepository.findByVariantId(variantId);

    if (!stock) {
      return null;
    }

    // Decrease reserved_quantity (item is no longer reserved, it's shipped)
    const newReservedQuantity = Math.max(0, stock.reserved_quantity - quantity);
    // Decrease available_quantity (item left the warehouse)
    const newAvailableQuantity = Math.max(
      0,
      stock.available_quantity - quantity,
    );
    // Recalculate stock_quantity = stock_on_hand + available_quantity
    // stock_on_hand stays unchanged (private stock is never touched by orders)
    const newStockQuantity = stock.stock_on_hand + newAvailableQuantity;

    const result = await this.inventoryStockRepository.update(stock.id, {
      reserved_quantity: newReservedQuantity,
      available_quantity: newAvailableQuantity,
      stock_quantity: newStockQuantity,
      // stock_on_hand is NOT updated - it's private seller stock
      updated_by: causer,
    });

    // Invalidate featured products cache if stock goes to zero (product becomes unavailable)
    if (newAvailableQuantity === 0) {
      await this.featuredProductsCacheService.invalidateByVariantId(variantId);
    }

    return result;
  }

  /**
   * Find inventory stock by variant ID
   * @param variantId Product variant ID
   * @returns Inventory stock or null if not found
   */
  async findByVariantId(variantId: number): Promise<InventoryStock | null> {
    return this.inventoryStockRepository.findByVariantId(variantId);
  }

  /**
   * Update inventory stock
   * @param id Inventory stock ID
   * @param data Partial inventory stock data
   * @param causer User updating the inventory stock
   * @returns Updated inventory stock
   */
  async update(
    id: number,
    data: Partial<InventoryStock>,
    causer: User,
  ): Promise<InventoryStock> {
    const updateData = {
      ...data,
      updated_by: causer,
    };

    return this.inventoryStockRepository.update(id, updateData);
  }

  /**
   * Delete inventory stock (soft delete)
   * Note: This should only be called when the associated product variant is deleted
   * @param id Inventory stock ID
   * @param causer User deleting the inventory stock
   */
  async delete(id: number, causer: User): Promise<void> {
    await this.inventoryStockRepository.remove(id, causer);
  }

  /**
   * Restock returned items - called when return inspection passes
   * Adds quantity back to available_quantity and recalculates stock_quantity
   * Used when a customer returns items and they pass inspection
   * @param variantId Product variant ID
   * @param quantity Quantity to restock
   * @param causer User performing the restock
   * @returns Updated inventory stock
   */
  async restockReturnedItem(
    variantId: number,
    quantity: number,
    causer: User,
  ): Promise<InventoryStock | null> {
    const stock =
      await this.inventoryStockRepository.findByVariantId(variantId);

    if (!stock) {
      // No stock record - skip restocking
      return null;
    }

    // Check if stock was previously zero (product was unavailable)
    const wasOutOfStock = stock.available_quantity === 0;

    // Add returned quantity back to available_quantity
    const newAvailableQuantity = stock.available_quantity + quantity;
    // Recalculate stock_quantity = stock_on_hand + available_quantity
    const newStockQuantity = stock.stock_on_hand + newAvailableQuantity;

    const result = await this.inventoryStockRepository.update(stock.id, {
      available_quantity: newAvailableQuantity,
      stock_quantity: newStockQuantity,
      updated_by: causer,
    });

    // Invalidate featured products cache if product becomes available again
    if (wasOutOfStock && newAvailableQuantity > 0) {
      await this.featuredProductsCacheService.invalidateByVariantId(variantId);
    }

    return result;
  }
}
