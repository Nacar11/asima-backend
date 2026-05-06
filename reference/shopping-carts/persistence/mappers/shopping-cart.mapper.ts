import { ShoppingCartEntity } from '@/shopping-carts/persistence/entities/shopping-cart.entity';
import { ShoppingCart, CartStore } from '@/shopping-carts/domain/shopping-cart';
import { ShoppingCartItem } from '@/shopping-carts/domain/shopping-cart-item';
import { CartSummary } from '@/shopping-carts/domain/cart-summary';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { ShoppingCartItemMapper } from './shopping-cart-item.mapper';

/**
 * Mapper for ShoppingCart domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM). Includes mapping of related entities
 * like items, user, and calculation of cart summary.
 *
 * @version 1
 * @since 1.0.0
 */
export class ShoppingCartMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns ShoppingCart domain model with items and summary
   */
  static toDomain(raw: ShoppingCartEntity): ShoppingCart {
    const domainEntity = new ShoppingCart();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Map user relation if loaded
    if (raw.user) {
      domainEntity.user = {
        id: raw.user.id,
        first_name: raw.user.first_name,
        last_name: raw.user.last_name,
        email: raw.user.email,
      };
    }

    // Map items relation if loaded
    if (raw.items) {
      const mappedItems = raw.items.map((item) =>
        ShoppingCartItemMapper.toDomain(item),
      );

      // Keep items for internal use (excluded from API response)
      domainEntity.items = mappedItems;

      // Group items by store (using seller_id/store_name from mapped items)
      domainEntity.stores = this.groupItemsByStore(mappedItems);

      // Calculate summary
      domainEntity.summary = this.calculateSummary(mappedItems);
    }

    // Map audit fields
    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model from business logic
   * @returns ShoppingCartEntity for TypeORM
   */
  static toPersistence(domainEntity: ShoppingCart): ShoppingCartEntity {
    const persistenceEntity = new ShoppingCartEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      user_id: domainEntity.user_id,
    });

    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as User,
      );
    }

    if (domainEntity.updated_by) {
      persistenceEntity.updated_by = UserMapper.toPersistence(
        domainEntity.updated_by as User,
      );
    }

    if (domainEntity.deleted_by) {
      persistenceEntity.deleted_by = UserMapper.toPersistence(
        domainEntity.deleted_by as User,
      );
    }

    return persistenceEntity;
  }

  /**
   * Calculate cart summary from items.
   *
   * - Counts (line_count, item_count): Include ALL items for cart badge display
   * - Monetary totals (subtotal, total_amount): Only SELECTED items for checkout
   * - Tax and shipping are reserved for future implementation.
   *
   * @param items - Array of shopping cart items
   * @returns CartSummary with counts for all items, totals for selected items
   */
  static calculateSummary(
    items: Array<{
      quantity: number;
      total_price?: number;
      is_selected?: boolean;
    }>,
  ): CartSummary {
    const summary = new CartSummary();

    // Counts include ALL items (for cart badge)
    summary.line_count = items.length;
    summary.item_count = items.reduce((sum, item) => sum + item.quantity, 0);

    // Monetary totals include only SELECTED items (for checkout)
    const selectedItems = items.filter((item) => item.is_selected);
    summary.subtotal = selectedItems.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0,
    );
    summary.tax_amount = 0; // Reserved for future tax calculations
    summary.shipping_amount = 0; // Reserved for future shipping calculations
    summary.total_amount =
      summary.subtotal + summary.tax_amount + summary.shipping_amount;

    // Round to 2 decimal places
    summary.subtotal = Math.round(summary.subtotal * 100) / 100;
    summary.total_amount = Math.round(summary.total_amount * 100) / 100;

    return summary;
  }

  /**
   * Group cart items by store/seller.
   *
   * @param mappedItems - Array of mapped shopping cart items (domain)
   * @returns Array of CartStore with grouped items
   */
  static groupItemsByStore(mappedItems: ShoppingCartItem[]): CartStore[] {
    const storeMap = new Map<number, CartStore>();

    for (const item of mappedItems) {
      // Get seller info from product (for product items) or service (for service items)
      const sellerId =
        item.variant?.product?.seller_id || item.service?.seller_id;
      const storeName =
        item.variant?.product?.store_name ||
        (item.service as any)?.seller?.store_name ||
        'Unknown Store';

      if (sellerId) {
        if (!storeMap.has(sellerId)) {
          storeMap.set(sellerId, {
            seller_id: sellerId,
            store_name: storeName,
            items: [],
          });
        }
        storeMap.get(sellerId)!.items.push(item);
      } else {
        // Items without seller go to a default "Unknown Store" group
        const unknownKey = 0;
        if (!storeMap.has(unknownKey)) {
          storeMap.set(unknownKey, {
            seller_id: 0,
            store_name: 'Unknown Store',
            items: [],
          });
        }
        storeMap.get(unknownKey)!.items.push(item);
      }
    }

    return Array.from(storeMap.values());
  }
}
