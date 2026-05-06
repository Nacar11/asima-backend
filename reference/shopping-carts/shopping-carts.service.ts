import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { RedisHelper } from '@/utils/helpers/redis.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseShoppingCartRepository } from './persistence/base-shopping-cart.repository';
import { BaseShoppingCartItemRepository } from './persistence/base-shopping-cart-item.repository';
import { ShoppingCart } from './domain/shopping-cart';
import { ShoppingCartItem } from './domain/shopping-cart-item';
import { CartSummary } from './domain/cart-summary';
import {
  AddCartItemResponse,
  AddCartItemStoreInfo,
} from './domain/add-cart-item-response';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { AddServiceToCartDto } from './dto/add-service-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { BulkUpdateCartItemsDto } from './dto/bulk-update-cart-items.dto';
import { BulkDeleteCartItemsDto } from './dto/bulk-delete-cart-items.dto';
import { User } from '@/users/domain/user';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ShoppingCartMapper } from './persistence/mappers/shopping-cart.mapper';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { ServicesService } from '@/services/services.service';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServicePackagesService } from '@/service-packages/service-packages.service';
import { CartItemTypeEnum } from './enums/cart-item-type.enum';
import { UserAddressesService } from '@/user-addresses/user-addresses.service';
import { ServiceAreasService } from '@/service-areas/service-areas.service';
import { SellersService } from '@/sellers/sellers.service';
import { AppointmentLocationTypeEnum } from '@/bookings/enums/appointment-location-type.enum';
import { SellerSchedulesService } from '@/seller-schedules/seller-schedules.service';
import { CartItemAddonRepository } from '@/cart-item-addons/persistence/repositories/cart-item-addon.repository';
import { CartItemOptionRepository } from '@/cart-item-options/persistence/repositories/cart-item-option.repository';
import { calculateServiceDuration } from '@/utils/helpers/calculations.helper';
import { ServiceAddonsService } from '@/service-addons/service-addons.service';
import { ServiceOptionGroupsService } from '@/service-option-groups/service-option-groups.service';
import { ServiceOptionPricingRulesService } from '@/service-option-pricing-rules/service-option-pricing-rules.service';
import {
  SelectedAddonDto,
  SelectedOptionDto,
} from './dto/add-service-to-cart.dto';

/** Threshold for low stock warning (items remaining) */
const LOW_STOCK_THRESHOLD = 10;

const CART_CACHE_KEY = (userId: number) => `cart:user:${userId}`;
const CART_CACHE_TTL = 300; // seconds
const REDIS_TIMEOUT_MS = 500; // fail-fast when Redis is slow/unreachable

/** Race a promise against a timeout — returns fallback on timeout */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/** Stock validation result with warning information */
interface StockValidationResult {
  available_quantity: number | null;
  has_stock_record: boolean;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  warning?: string;
}

/**
 * Service for managing shopping carts in the e-commerce platform.
 *
 * This service provides comprehensive business logic for cart operations,
 * including adding items, updating quantities, and removing items.
 * Performs validation for stock availability, minimum order requirements,
 * variant active status, and product published status.
 *
 * @version 1
 * @since 1.0.0
 * @author E-commerce Module Team
 */
@Injectable()
export class ShoppingCartsService {
  constructor(
    private readonly cartRepository: BaseShoppingCartRepository,
    private readonly cartItemRepository: BaseShoppingCartItemRepository,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly inventoryStocksService: InventoryStocksService,
    private readonly servicesService: ServicesService,
    private readonly servicePackagesService: ServicePackagesService,
    private readonly userAddressesService: UserAddressesService,
    private readonly serviceAreasService: ServiceAreasService,
    private readonly sellerSchedulesService: SellerSchedulesService,
    private readonly cartItemAddonRepository: CartItemAddonRepository,
    private readonly cartItemOptionRepository: CartItemOptionRepository,
    private readonly serviceAddonsService: ServiceAddonsService,
    private readonly serviceOptionGroupsService: ServiceOptionGroupsService,
    private readonly serviceOptionPricingRulesService: ServiceOptionPricingRulesService,
    private readonly sellersService: SellersService,
    private readonly redisHelper: RedisHelper,
  ) {}

  /**
   * Get or create the current user's shopping cart.
   *
   * Convenience method for users to discover their cart ID.
   * If the user doesn't have a cart, creates one automatically.
   * Returns the cart with all items and calculated summary.
   *
   * This is a convenience endpoint not explicitly in the PRD,
   * but necessary for cart discovery (how does user know their cart ID?).
   *
   * @param user - The authenticated user
   * @returns Promise<ShoppingCart> - The user's cart with items and summary
   *
   * @example
   * ```typescript
   * const cart = await this.getMyCart(user);
   * // Returns: { id: 1, items: [...], summary: { item_count: 3, subtotal: 1500 } }
   * // Frontend can now use cart.id for PRD endpoints
   * ```
   */
  async getMyCart(user: User): Promise<ShoppingCart> {
    const cacheKey = CART_CACHE_KEY(user.id);

    // Fail-fast cache read — 500ms timeout prevents blocking when Redis is down
    const cached = await withTimeout(
      this.redisHelper.get(cacheKey),
      REDIS_TIMEOUT_MS,
      null,
    );
    if (cached) return JSON.parse(cached) as ShoppingCart;

    // Slim single-query path: product items only, exact column projection
    let cart = await this.cartRepository.findSlimProductCartByUserId(user.id);

    // Auto-create cart if it doesn't exist
    if (!cart) {
      const newCart = Object.assign(new ShoppingCart(), {
        user_id: user.id,
        created_by: user,
        updated_by: user,
      });
      cart = await this.cartRepository.create(newCart);
    }

    // Fire-and-forget cache write — never block the response on Redis
    this.redisHelper
      .set(cacheKey, JSON.stringify(cart), CART_CACHE_TTL)
      .catch(() => {});

    return cart;
  }

  /**
   * Get the full cart with all items populated (products + services).
   *
   * Use this for backend operations that need cart.items — checkout preview,
   * order creation, stock reservation. NOT for the mobile cart page (use
   * getMyCart instead, which is slim and cached).
   *
   * @param user - The authenticated user
   * @returns Promise<ShoppingCart> - Full cart with items array populated
   */
  async getCartWithItems(user: User): Promise<ShoppingCart> {
    let cart = await this.cartRepository.findByUserId(user.id, true);

    if (!cart) {
      const newCart = Object.assign(new ShoppingCart(), {
        user_id: user.id,
        created_by: user,
        updated_by: user,
      });
      cart = await this.cartRepository.create(newCart);
    }

    return cart;
  }

  /**
   * Get a cart by ID with paginated items.
   *
   * PRD Section 5.5 Line 341-346 - GET /api/shopping-carts/:cartId
   * Users can only view their own cart. Supports pagination for >100 items.
   * Default pagination: page=1, limit=20 (max 100).
   *
   * @param cartId - The shopping cart ID
   * @param user - The requesting user
   * @param pagination - Pagination parameters { page, limit } per PRD
   * @returns Promise<ShoppingCart> - Cart with paginated items
   *
   * @throws {NotFoundException} When cart is not found
   * @throws {ForbiddenException} When user doesn't have permission
   *
   * @example
   * ```typescript
   * const cart = await this.getCartByIdWithPagination(1, user, { page: 1, limit: 20 });
   * ```
   */
  async getCartByIdWithPagination(
    cartId: number,
    user: User,
    pagination: { page: number; limit: number },
  ): Promise<ShoppingCart> {
    const { page = 1, limit = 20 } = pagination;

    const cart = await this.cartRepository.findByIdWithPaginatedItems(
      cartId,
      page,
      limit,
    );

    if (!cart) {
      throw new NotFoundException(`Shopping cart with ID ${cartId} not found`);
    }

    // Authorization: Only admin or cart owner can access
    if (!user.system_admin && cart.user_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this cart',
      );
    }

    return cart;
  }

  /**
   * Add an item to the shopping cart.
   *
   * Validates stock availability and minimum order requirements before
   * adding the item. If the variant already exists in the cart, increments
   * the quantity instead of creating a duplicate entry.
   *
   * @param cartId - The shopping cart ID
   * @param input - The item to add with variant ID and quantity
   * @param user - The user performing the action
   * @returns Promise<AddCartItemResponse> - Cart summary plus the affected item and store
   *
   * @throws {NotFoundException} When cart, variant or product is not found
   * @throws {ForbiddenException} When user doesn't own the cart
   * @throws {BadRequestException} When quantity validation fails
   * @throws {UnprocessableEntityException} When business rules are violated
   *
   * @example
   * ```typescript
   * const response = await this.addItem(1, { variant_id: 5, quantity: 2 }, user);
   * // Returns: { item_count: 3, subtotal: 1500, item: {...}, store: {...} }
   * ```
   */
  async addItem(
    cartId: number,
    input: AddCartItemDto,
    user: User,
  ): Promise<AddCartItemResponse> {
    // Validate variant and product
    await this.validateVariantAndProduct(input.variant_id, input.quantity);

    // Get cart and verify ownership
    const cart = await this.cartRepository.findById(cartId, false);
    if (!cart) {
      throw new NotFoundException(`Shopping cart with ID ${cartId} not found`);
    }

    // Authorization check
    if (cart.user_id !== user.id) {
      throw new ForbiddenException('You can only add items to your own cart');
    }

    // Check if variant already exists in cart
    const existingItem = await this.cartItemRepository.findByCartAndVariant(
      cart.id,
      input.variant_id,
    );

    // Determine final quantity for stock check
    const finalQuantity = existingItem
      ? existingItem.quantity + input.quantity
      : input.quantity;

    let affectedItemId: number;

    if (existingItem) {
      // Update existing item quantity
      await this.validateVariantAndProduct(input.variant_id, finalQuantity);

      const partialItem: Partial<ShoppingCartItem> = {
        quantity: finalQuantity,
        updated_by: user,
      };
      const updatedItem = await this.cartItemRepository.update(
        existingItem.id,
        partialItem,
      );
      affectedItemId = updatedItem.id;
    } else {
      // Create new cart item
      const newItem = Object.assign(new ShoppingCartItem(), {
        shopping_cart_id: cart.id,
        variant_id: input.variant_id,
        quantity: input.quantity,
        is_selected: input.is_selected ?? false,
        created_by: user,
        updated_by: user,
      });
      const createdItem = await this.cartItemRepository.create(newItem);
      affectedItemId = createdItem.id;
    }

    // Update cart timestamp
    await this.cartRepository.update(cart.id, { updated_by: user });

    // Check stock availability (for low-stock validation, result discarded from response)
    await this.checkStockAvailability(input.variant_id);

    const item =
      await this.cartItemRepository.findByIdForCartResponse(affectedItemId);

    if (!item) {
      throw new NotFoundException(
        `Shopping cart item with ID ${affectedItemId} not found`,
      );
    }

    const summary = await this.getCartSummary(cartId, user);

    await this.redisHelper.del(CART_CACHE_KEY(user.id));

    return {
      ...summary,
      item,
      store: this.getStoreInfoForCartItem(item),
    };
  }

  private getStoreInfoForCartItem(
    item: ShoppingCartItem,
  ): AddCartItemStoreInfo {
    return {
      seller_id:
        item.variant?.product?.seller_id || item.service?.seller_id || 0,
      store_name:
        item.variant?.product?.store_name ||
        (item.service as any)?.seller?.store_name ||
        'Unknown Store',
    };
  }

  /**
   * Update a cart item (quantity and/or selection status).
   *
   * Validates that the new quantity meets minimum order requirements
   * and doesn't exceed available stock.
   *
   * @param itemId - The cart item ID to update
   * @param input - The update data (quantity and/or is_selected)
   * @param user - The user performing the action
   * @returns Promise<ShoppingCart> - The updated shopping cart
   *
   * @throws {NotFoundException} When cart item is not found
   * @throws {ForbiddenException} When user doesn't own the cart
   * @throws {BadRequestException} When quantity validation fails
   *
   * @example
   * ```typescript
   * // Update quantity
   * const cart = await this.updateItem(1, { quantity: 5 }, user);
   * // Update selection
   * const cart = await this.updateItem(1, { is_selected: true }, user);
   * // Update both
   * const cart = await this.updateItem(1, { quantity: 5, is_selected: true }, user);
   * ```
   */
  async updateItem(
    itemId: number,
    input: UpdateCartItemDto,
    user: User,
  ): Promise<ShoppingCartItem> {
    // Find cart item
    const cartItem = await this.cartItemRepository.findById(itemId);
    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    // Verify ownership
    const cart = await this.cartRepository.findById(
      cartItem.shopping_cart_id,
      false,
    );
    if (!cart || cart.user_id !== user.id) {
      throw new ForbiddenException(
        'You can only update items in your own cart',
      );
    }

    // Validate new quantity if provided (only for product items)
    if (input.quantity !== undefined) {
      if (
        cartItem.item_type === 'product' &&
        cartItem.variant_id !== null &&
        cartItem.variant_id !== undefined
      ) {
        await this.validateVariantAndProduct(
          cartItem.variant_id,
          input.quantity,
        );
      } else {
        // For service items, just validate quantity is positive
        if (input.quantity < 1) {
          throw new BadRequestException('Quantity must be at least 1');
        }
      }
    }

    // Build update object
    const partialItem: Partial<ShoppingCartItem> = {
      updated_by: user,
    };

    if (input.quantity !== undefined) {
      partialItem.quantity = input.quantity;
    }

    if (input.is_selected !== undefined) {
      partialItem.is_selected = input.is_selected;
    }

    await this.cartItemRepository.update(itemId, partialItem);

    // Update cart timestamp
    await this.cartRepository.update(cart.id, { updated_by: user });

    // Check stock availability and get warnings (only if quantity was updated and it's a product item)
    let stockWarning: string | undefined;
    if (
      input.quantity !== undefined &&
      cartItem.item_type === 'product' &&
      cartItem.variant_id !== null &&
      cartItem.variant_id !== undefined
    ) {
      const stockResult = await this.checkStockAvailability(
        cartItem.variant_id,
      );
      stockWarning = stockResult.warning;
    }

    // Return just the updated item
    const updatedItem = await this.cartItemRepository.findById(itemId);

    if (stockWarning && updatedItem) {
      updatedItem.warning = stockWarning;
    }

    await this.redisHelper.del(CART_CACHE_KEY(user.id));

    return updatedItem!;
  }

  /**
   * Update the quantity of a cart item (legacy method for compatibility).
   * @deprecated Use updateItem instead
   */
  async updateItemQuantity(
    itemId: number,
    input: UpdateCartItemDto,
    user: User,
  ): Promise<ShoppingCartItem> {
    return this.updateItem(itemId, input, user);
  }

  /**
   * Remove an item from the shopping cart.
   *
   * Soft deletes the cart item. The item can be restored later if needed.
   *
   * @param itemId - The cart item ID to remove
   * @param user - The user performing the action
   * @returns Promise<ShoppingCart> - The updated shopping cart
   *
   * @throws {NotFoundException} When cart item is not found
   * @throws {ForbiddenException} When user doesn't own the cart
   *
   * @example
   * ```typescript
   * await this.removeItem(1, user);
   * ```
   */
  async removeItem(itemId: number, user: User): Promise<void> {
    // Find cart item
    const cartItem = await this.cartItemRepository.findById(itemId);
    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    // Verify ownership
    const cart = await this.cartRepository.findById(
      cartItem.shopping_cart_id,
      false,
    );
    if (!cart || cart.user_id !== user.id) {
      throw new ForbiddenException(
        'You can only remove items from your own cart',
      );
    }

    // Soft delete item
    const partialItem: Partial<ShoppingCartItem> = {
      deleted_by: user,
    };
    await this.cartItemRepository.update(itemId, partialItem);
    await this.cartItemRepository.remove(itemId);

    // Update cart timestamp
    await this.cartRepository.update(cart.id, { updated_by: user });

    await this.redisHelper.del(CART_CACHE_KEY(user.id));
  }

  /**
   * Get cart summary for the current user.
   *
   * PRD Section 5.5 Line 369-374 - GET /api/shopping-carts/summary
   * Provides a lightweight endpoint for real-time cart updates without fetching full cart.
   * Returns only the summary with item count and totals.
   *
   * @param user - The authenticated user
   * @returns Promise<CartSummary> - Cart summary with totals
   *
   * @throws {NotFoundException} When cart is not found
   *
   * @example
   * ```typescript
   * const summary = await this.getCartSummaryByUserId(user);
   * // Returns: { item_count: 3, subtotal: 1500, total_amount: 1500 }
   * ```
   */
  async getCartSummaryByUserId(user: User): Promise<CartSummary> {
    const cart = await this.cartRepository.findByUserId(user.id, true);

    if (!cart) {
      throw new NotFoundException('Shopping cart not found');
    }

    return cart.summary || ShoppingCartMapper.calculateSummary([]);
  }

  /**
   * Get cart summary for a specific cart by ID.
   *
   * PRD Section 5.5 Line 369-374 - GET /api/shopping-carts/:cartId/summary
   * Provides a lightweight endpoint for real-time cart updates without fetching full cart.
   * Users can only access their own cart summary.
   *
   * @param cartId - The shopping cart ID
   * @param user - The requesting user
   * @returns Promise<CartSummary> - Cart summary with totals
   *
   * @throws {NotFoundException} When cart is not found
   * @throws {ForbiddenException} When user doesn't have permission
   *
   * @example
   * ```typescript
   * const summary = await this.getCartSummary(1, user);
   * // Returns: { item_count: 3, subtotal: 1500, total_amount: 1500 }
   * ```
   */
  async getCartSummary(cartId: number, user: User): Promise<CartSummary> {
    const cart = await this.cartRepository.findById(cartId, true);

    if (!cart) {
      throw new NotFoundException(`Shopping cart with ID ${cartId} not found`);
    }

    // Authorization: Only admin or cart owner can access
    if (!user.system_admin && cart.user_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this cart summary',
      );
    }

    return cart.summary || ShoppingCartMapper.calculateSummary([]);
  }

  /**
   * Clear selected items from user's cart (soft delete).
   *
   * Called after successful checkout to remove only selected items from the cart.
   * Unselected items remain in the cart for future purchase.
   * Items are soft deleted and can be recovered if needed.
   *
   * @param user - The user whose cart to clear
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await this.clearCart(user);
   * ```
   */
  async clearCart(user: User): Promise<void> {
    const cart = await this.cartRepository.findByUserId(user.id, true);

    if (!cart || !cart.items?.length) {
      return;
    }

    // Soft delete only selected items
    const selectedItems = cart.items.filter((item) => item.is_selected);

    for (const item of selectedItems) {
      const partialItem: Partial<ShoppingCartItem> = {
        deleted_by: user,
      };
      await this.cartItemRepository.update(item.id, partialItem);
      await this.cartItemRepository.remove(item.id);
    }

    // Update cart timestamp
    await this.cartRepository.update(cart.id, { updated_by: user });

    await this.redisHelper.del(CART_CACHE_KEY(user.id));
  }

  /**
   * Clear only selected product items from user's cart (soft delete).
   *
   * Similar to clearCart but only removes product items, leaving service items
   * in the cart. Useful when service items are included in order totals but
   * not tracked as order items.
   *
   * @param user - The user whose cart to clear
   * @returns Promise<void>
   */
  async clearSelectedProductItems(user: User): Promise<void> {
    const cart = await this.cartRepository.findByUserId(user.id, true);

    if (!cart || !cart.items?.length) {
      return;
    }

    // Soft delete only selected product items
    const selectedProductItems = cart.items.filter(
      (item) =>
        item.is_selected &&
        item.item_type === CartItemTypeEnum.PRODUCT &&
        item.variant_id !== null &&
        item.variant_id !== undefined,
    );

    for (const item of selectedProductItems) {
      const partialItem: Partial<ShoppingCartItem> = {
        deleted_by: user,
      };
      await this.cartItemRepository.update(item.id, partialItem);
      await this.cartItemRepository.remove(item.id);
    }

    // Update cart timestamp
    await this.cartRepository.update(cart.id, { updated_by: user });

    await this.redisHelper.del(CART_CACHE_KEY(user.id));
  }

  /**
   * Bulk update is_selected status for multiple cart items.
   *
   * Updates the selection status of specified items in a single operation.
   * All item IDs must belong to the specified cart.
   *
   * @param cartId - The shopping cart ID
   * @param input - The bulk update data with item IDs and is_selected value
   * @param user - The user performing the action
   * @returns Promise<ShoppingCart> - The updated shopping cart
   *
   * @throws {NotFoundException} When cart is not found
   * @throws {ForbiddenException} When user doesn't own the cart
   * @throws {BadRequestException} When item IDs don't belong to the cart
   *
   * @example
   * ```typescript
   * const cart = await this.bulkUpdateItems(1, { item_ids: [1, 2, 3], is_selected: true }, user);
   * ```
   */
  async bulkUpdateItems(
    cartId: number,
    input: BulkUpdateCartItemsDto,
    user: User,
  ): Promise<void> {
    // Get cart and verify ownership
    const cart = await this.cartRepository.findById(cartId, true);
    if (!cart) {
      throw new NotFoundException(`Shopping cart with ID ${cartId} not found`);
    }

    // Authorization check
    if (!user.system_admin && cart.user_id !== user.id) {
      throw new ForbiddenException(
        'You can only update items in your own cart',
      );
    }

    // Validate all item IDs belong to this cart
    const cartItemIds = new Set(cart.items?.map((item) => item.id) || []);
    const invalidIds = input.item_ids.filter((id) => !cartItemIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Item IDs [${invalidIds.join(', ')}] do not belong to this cart`,
      );
    }

    // Perform bulk update
    await this.cartItemRepository.bulkUpdateSelection(
      input.item_ids,
      input.is_selected,
      user.id,
    );

    // Update cart timestamp
    await this.cartRepository.update(cart.id, { updated_by: user });

    await this.redisHelper.del(CART_CACHE_KEY(user.id));
  }

  /**
   * Bulk delete multiple cart items.
   *
   * Soft deletes specified items in a single operation.
   * All item IDs must belong to the specified cart.
   *
   * @param cartId - The shopping cart ID
   * @param input - The bulk delete data with item IDs
   * @param user - The user performing the action
   * @returns Promise<ShoppingCart> - The updated shopping cart
   *
   * @throws {NotFoundException} When cart is not found
   * @throws {ForbiddenException} When user doesn't own the cart
   * @throws {BadRequestException} When item IDs don't belong to the cart
   *
   * @example
   * ```typescript
   * const cart = await this.bulkDeleteItems(1, { item_ids: [1, 2, 3] }, user);
   * ```
   */
  async bulkDeleteItems(
    cartId: number,
    input: BulkDeleteCartItemsDto,
    user: User,
  ): Promise<ShoppingCart> {
    // Get cart and verify ownership
    const cart = await this.cartRepository.findById(cartId, true);
    if (!cart) {
      throw new NotFoundException(`Shopping cart with ID ${cartId} not found`);
    }

    // Authorization check
    if (!user.system_admin && cart.user_id !== user.id) {
      throw new ForbiddenException(
        'You can only delete items from your own cart',
      );
    }

    // Validate all item IDs belong to this cart
    const cartItemIds = new Set(cart.items?.map((item) => item.id) || []);
    const invalidIds = input.item_ids.filter((id) => !cartItemIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Item IDs [${invalidIds.join(', ')}] do not belong to this cart`,
      );
    }

    // Perform bulk soft delete
    await this.cartItemRepository.bulkSoftDelete(input.item_ids, user.id);

    // Update cart timestamp
    await this.cartRepository.update(cart.id, { updated_by: user });

    await this.redisHelper.del(CART_CACHE_KEY(user.id));

    // Return updated cart
    return this.getCartByIdWithPagination(cartId, user, {
      page: 1,
      limit: 20,
    });
  }

  /**
   * Add a service item to the shopping cart.
   *
   * Validates service availability and scheduling before adding the item.
   * If the same service with the same scheduling already exists in the cart,
   * increments the quantity instead of creating a duplicate entry.
   *
   * @param cartId - The shopping cart ID
   * @param input - The service item to add with service ID, package ID, scheduling, and quantity
   * @param user - The user performing the action
   * @returns Promise<ShoppingCart> - The updated shopping cart with all items
   *
   * @throws {NotFoundException} When cart, service, or package is not found
   * @throws {ForbiddenException} When user doesn't own the cart
   * @throws {BadRequestException} When validation fails
   * @throws {UnprocessableEntityException} When business rules are violated
   *
   * @example
   * ```typescript
   * const cart = await this.addServiceItem(1, {
   *   service_id: 10,
   *   package_id: 3,
   *   scheduled_date: '2024-12-25',
   *   scheduled_start_time: '09:00:00',
   *   quantity: 1
   * }, user);
   * ```
   */
  async addServiceItem(
    cartId: number,
    input: AddServiceToCartDto,
    user: User,
  ): Promise<ShoppingCart> {
    // Validate service and package
    const service = await this.validateServiceAndPackage(
      input.service_id,
      input.package_id,
      input.quantity,
    );

    // Get cart and verify ownership
    const cart = await this.cartRepository.findById(cartId, false);
    if (!cart) {
      throw new NotFoundException(`Shopping cart with ID ${cartId} not found`);
    }

    // Authorization check
    if (cart.user_id !== user.id) {
      throw new ForbiddenException('You can only add items to your own cart');
    }

    // Validate service requires quote - cannot add to cart if quote is required
    if (service.requires_quote) {
      throw new UnprocessableEntityException(
        'This service requires a custom quote and cannot be added directly to cart. Please request a quote first.',
      );
    }

    const isVenue = service.service_type === ServiceTypeEnum.VENUE;

    // Venue services: require scheduled_end_time, force walk-in, quantity 1
    if (isVenue) {
      if (!input.scheduled_end_time) {
        throw new UnprocessableEntityException(
          'Venue services require a scheduled end time (select one or more consecutive slots).',
        );
      }
    }

    // Determine appointment location type (venue always walk-in)
    const appointmentLocationType = isVenue
      ? AppointmentLocationTypeEnum.WALK_IN
      : (input.appointment_location_type as AppointmentLocationTypeEnum) ||
        AppointmentLocationTypeEnum.HOME_SERVICE;

    // Validate based on appointment location type
    let serviceAddress: any = null;
    let additionalFee = 0;

    if (appointmentLocationType === AppointmentLocationTypeEnum.WALK_IN) {
      // Walk-in: no customer address needed, no coverage check, no fee
      const seller = await this.sellersService.findById(service.seller_id);
      if (!seller?.service_location_address_id) {
        throw new UnprocessableEntityException(
          'This provider has not set up a walk-in service location.',
        );
      }
    } else if (appointmentLocationType === AppointmentLocationTypeEnum.REMOTE) {
      // Remote: no address needed
    } else {
      // Home service: require address, check coverage, calc fee
      if (!input.service_address_id) {
        throw new UnprocessableEntityException(
          'This service requires a physical address. Please provide a service address.',
        );
      }

      try {
        serviceAddress = await this.userAddressesService.findOne(
          input.service_address_id,
          user,
        );

        // Check location coverage for home service
        const coverageCheck =
          await this.serviceAreasService.checkLocationCoverage({
            service_id: input.service_id,
            city: serviceAddress.city,
            province: serviceAddress.province,
            postal_code: serviceAddress.postal_code,
            latitude: serviceAddress.latitude,
            longitude: serviceAddress.longitude,
          });

        if (!coverageCheck.covered) {
          throw new UnprocessableEntityException(
            'This service is not available at the specified address location',
          );
        }

        if (coverageCheck.additional_fee) {
          additionalFee = coverageCheck.additional_fee;
        }
      } catch (error) {
        if (error instanceof UnprocessableEntityException) {
          throw error;
        }
        throw new NotFoundException(
          `Service address with ID ${input.service_address_id} not found`,
        );
      }
    }

    // Parse scheduled date
    const scheduledDate = new Date(input.scheduled_date);

    // Check if service with same scheduling already exists in cart FIRST
    // If it exists, we can skip availability check and just increment quantity
    const existingItem = await this.cartItemRepository.findByCartAndService(
      cart.id,
      input.service_id,
      input.package_id ?? null,
      scheduledDate,
      input.scheduled_start_time,
    );

    const hasCustomizationSelection =
      (input.selected_addons?.length ?? 0) > 0 ||
      (input.selected_options?.length ?? 0) > 0;

    // Venue services and customized service selections should not merge into existing cart items.
    if (!isVenue && !hasCustomizationSelection && existingItem) {
      // Update existing item quantity - no need to re-check availability
      const finalQuantity = existingItem.quantity + (input.quantity ?? 1);
      const partialItem: Partial<ShoppingCartItem> = {
        quantity: finalQuantity,
        updated_by: user,
      };
      await this.cartItemRepository.update(existingItem.id, partialItem);
    } else {
      // Only check availability for NEW cart items
      let endTime: string;

      if (isVenue) {
        // Venue: use customer-selected end time directly
        endTime = input.scheduled_end_time!;
      } else {
        // Non-venue: calculate estimated end time from duration
        let durationMinutes = service.estimated_duration_minutes || 60;
        if (input.package_id) {
          const pkg = await this.servicePackagesService.findById(
            input.package_id,
          );
          if (pkg.duration_minutes) {
            durationMinutes = pkg.duration_minutes;
          }
        }
        const startMinutes = this.timeToMinutes(input.scheduled_start_time);
        const endMinutes = startMinutes + durationMinutes;
        endTime = this.minutesToTime(endMinutes);
      }

      // Validate time slot availability
      // Exclude current user's bookings to allow adding to cart even if they have existing booking
      // This prevents blocking users from modifying their cart when they already have a booking
      const availabilityCheck =
        await this.sellerSchedulesService.checkAvailability({
          seller_id: service.seller_id,
          date: input.scheduled_date,
          start_time: input.scheduled_start_time,
          end_time: endTime,
          service_id: input.service_id,
          exclude_customer_id: user.id,
        });

      if (!availabilityCheck.available) {
        throw new UnprocessableEntityException(
          availabilityCheck.reason ||
            'The selected time slot is not available. Please choose another time.',
        );
      }

      // Create new cart item with additional fee stored
      const newItem = Object.assign(new ShoppingCartItem(), {
        shopping_cart_id: cart.id,
        service_id: input.service_id,
        package_id: input.package_id ?? null,
        item_type: CartItemTypeEnum.SERVICE,
        scheduled_date: scheduledDate,
        scheduled_start_time: input.scheduled_start_time,
        scheduled_end_time: isVenue ? input.scheduled_end_time : null,
        service_address_id: input.service_address_id ?? null,
        special_requests: input.special_requests ?? null,
        form_submission_id: input.form_submission_id ?? null,
        quantity: isVenue ? 1 : (input.quantity ?? 1),
        is_selected: input.is_selected ?? false,
        location_additional_fee: additionalFee,
        appointment_location_type: appointmentLocationType,
        created_by: user,
        updated_by: user,
      });
      const savedItem = await this.cartItemRepository.create(newItem);

      // Sync addons if provided
      if (input.selected_addons && input.selected_addons.length > 0) {
        await this.syncCartItemAddons(savedItem.id, input.selected_addons);
      }

      // Sync options if provided
      if (input.selected_options && input.selected_options.length > 0) {
        await this.syncCartItemOptions(
          savedItem.id,
          service.id,
          input.selected_options,
        );
      }
    }

    // Update cart timestamp
    await this.cartRepository.update(cart.id, { updated_by: user });

    await this.redisHelper.del(CART_CACHE_KEY(user.id));

    // Return updated cart with items
    return this.getCartByIdWithPagination(cartId, user, {
      page: 1,
      limit: 20,
    });
  }

  /**
   * Convert time string (HH:mm:ss) to minutes.
   * @private
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((v) => Number(v));
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string (HH:mm:ss).
   * @private
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  /**
   * Calculate total duration for a cart item including base duration,
   * selected variant options, and add-ons.
   *
   * Formula:
   * Total Duration = Base Duration
   *                + Σ(Selected Option duration_adjustment_minutes × quantity)
   *                + Σ(Add-on duration_minutes × quantity)
   *
   * @param cartItemId - The cart item ID to calculate duration for
   * @param baseDurationMinutes - The service or package base duration
   * @returns Total duration in minutes
   * @private
   */
  async calculateCartItemDuration(
    cartItemId: number,
    baseDurationMinutes: number,
  ): Promise<number> {
    // Fetch selected options for this cart item
    const selectedOptions =
      await this.cartItemOptionRepository.findByCartItemId(cartItemId);

    // Fetch selected addons for this cart item (with addon details for duration_minutes)
    const selectedAddonsEntities =
      await this.cartItemAddonRepository.findByCartItemIdWithAddon(cartItemId);

    // Map to the format expected by calculateServiceDuration
    const optionsDuration = selectedOptions.map((opt) => ({
      duration_adjustment_minutes: opt.duration_adjustment_minutes || 0,
      quantity: opt.quantity || 1,
    }));

    const addonsDuration = selectedAddonsEntities.map((addon) => ({
      duration_minutes: addon.addon?.duration_minutes || 0,
      quantity: addon.quantity || 1,
    }));

    return calculateServiceDuration(
      baseDurationMinutes,
      optionsDuration,
      addonsDuration,
    );
  }

  /**
   * Validate service and package against business rules.
   *
   * Checks:
   * - Service exists
   * - Service is approved/active
   * - Package exists (if provided)
   * - Package belongs to the service
   * - Package is active
   * - Quantity is valid (defaults to 1 for services)
   *
   * @param serviceId - The service ID
   * @param packageId - The service package ID (optional)
   * @param quantity - The requested quantity (defaults to 1)
   * @returns Promise<Service> - The validated service
   *
   * @throws {NotFoundException} When service or package is not found
   * @throws {UnprocessableEntityException} When business rules are violated
   *
   * @private
   */
  private async validateServiceAndPackage(
    serviceId: number,
    packageId: number | null | undefined,
    quantity: number = 1,
  ) {
    // Find service
    const service = await this.servicesService.findById(serviceId);
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Check service status (must be ACTIVE for booking)
    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new UnprocessableEntityException(
        'This service is not available for booking',
      );
    }

    // Validate package if provided
    if (packageId) {
      const servicePackage =
        await this.servicePackagesService.findById(packageId);
      if (!servicePackage) {
        throw new NotFoundException(
          `Service package with ID ${packageId} not found`,
        );
      }

      // Verify package belongs to the service
      if (servicePackage.service_id !== serviceId) {
        throw new BadRequestException(
          'Service package does not belong to the specified service',
        );
      }

      // Check package status
      if (servicePackage.status !== 'Active') {
        throw new UnprocessableEntityException(
          'This service package is not available',
        );
      }
    }

    // Validate quantity
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    return service;
  }

  /**
   * Validate product variant and quantity against business rules.
   *
   * Checks:
   * - Variant exists
   * - Variant is active
   * - Product exists
   * - Product is published
   * - Quantity meets minimum order requirement
   *
   * @param variantId - The product variant ID
   * @param quantity - The requested quantity
   * @returns Promise<void>
   *
   * @throws {NotFoundException} When variant or product is not found
   * @throws {UnprocessableEntityException} When business rules are violated
   *
   * @private
   */
  private async validateVariantAndProduct(
    variantId: number,
    quantity: number,
  ): Promise<void> {
    // Find variant with product
    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException(
        `Product variant with ID ${variantId} not found`,
      );
    }

    // Check variant status
    if (variant.status !== 'Active') {
      throw new UnprocessableEntityException(
        'This product variant is not available for purchase',
      );
    }

    // Check product exists and is published
    if (!variant.product) {
      throw new NotFoundException('Product not found for this variant');
    }

    if (variant.product.status !== 'Published') {
      throw new UnprocessableEntityException(
        'This product is not currently available for purchase',
      );
    }

    // Check minimum order quantity
    if (quantity < variant.minimum_order) {
      throw new BadRequestException(
        `Minimum order quantity for this product is ${variant.minimum_order}`,
      );
    }

    // Check stock availability - block if quantity exceeds available stock
    const stock = await this.inventoryStocksService.findByVariantId(variantId);
    if (stock) {
      if (stock.available_quantity <= 0) {
        throw new UnprocessableEntityException(
          'This item is currently out of stock',
        );
      }
      if (quantity > stock.available_quantity) {
        throw new UnprocessableEntityException(
          `Only ${stock.available_quantity} item(s) available in stock`,
        );
      }
    }
  }

  /**
   * Check stock availability and return warning information.
   *
   * Returns low stock warnings for items that were successfully added.
   * Out-of-stock and insufficient stock cases are blocked by validateVariantAndProduct.
   *
   * @param variantId - The product variant ID
   * @returns Promise<StockValidationResult> - Stock status with warning info
   *
   * @private
   */
  private async checkStockAvailability(
    variantId: number,
  ): Promise<StockValidationResult> {
    const stock = await this.inventoryStocksService.findByVariantId(variantId);

    // No stock record means unlimited availability
    if (!stock) {
      return {
        available_quantity: null,
        has_stock_record: false,
        is_low_stock: false,
        is_out_of_stock: false,
      };
    }

    const availableQty = stock.available_quantity;
    const isLowStock = availableQty > 0 && availableQty <= LOW_STOCK_THRESHOLD;

    let warning: string | undefined;

    // Only show low stock warning (out-of-stock and insufficient are blocked)
    if (isLowStock) {
      warning = `Low stock: Only ${availableQty} item(s) remaining.`;
    }

    return {
      available_quantity: availableQty,
      has_stock_record: true,
      is_low_stock: isLowStock,
      is_out_of_stock: false,
      warning,
    };
  }

  /**
   * Sync add-ons to a cart item.
   *
   * Fetches addon details from the service addons table to get current prices,
   * then syncs them to the cart_item_addons table.
   *
   * @param cartItemId - The cart item ID
   * @param selectedAddons - Array of selected add-ons with addon_id and quantity
   * @private
   */
  private async syncCartItemAddons(
    cartItemId: number,
    selectedAddons: SelectedAddonDto[],
  ): Promise<void> {
    const addonData: {
      addon_id: number;
      quantity: number;
      unit_price: number;
    }[] = [];

    for (const selected of selectedAddons) {
      try {
        const addon = await this.serviceAddonsService.findById(
          selected.addon_id,
        );
        addonData.push({
          addon_id: selected.addon_id,
          quantity: selected.quantity,
          unit_price: addon.price,
        });
      } catch {
        // Skip invalid addon IDs - they may have been deleted
        continue;
      }
    }

    if (addonData.length > 0) {
      await this.cartItemAddonRepository.syncAddons(cartItemId, addonData);
    }
  }

  /**
   * Sync options to a cart item.
   *
   * Fetches option value details to get price/duration adjustments,
   * then syncs them to the cart_item_options table.
   *
   * @param cartItemId - The cart item ID
   * @param selectedOptions - Array of selected options with option_group_id, option_value_id, and quantity
   * @private
   */
  private async syncCartItemOptions(
    cartItemId: number,
    serviceId: number,
    selectedOptions: SelectedOptionDto[],
  ): Promise<void> {
    if (!selectedOptions || selectedOptions.length === 0) {
      await this.cartItemOptionRepository.removeAllForCartItem(cartItemId);
      return;
    }

    const serviceOptionGroups =
      await this.serviceOptionGroupsService.findByServiceId(serviceId);
    const optionGroupById = new Map(
      serviceOptionGroups.map((group) => [group.id, group]),
    );

    if (optionGroupById.size === 0) {
      throw new BadRequestException(
        'This service does not have configurable option groups',
      );
    }

    const optionData: {
      option_group_id: number;
      option_value_id: number;
      quantity: number;
      price_adjustment: number;
      duration_adjustment_minutes: number;
    }[] = [];

    const seenGroupIds = new Set<number>();
    for (const selected of selectedOptions) {
      if (seenGroupIds.has(selected.option_group_id)) {
        throw new BadRequestException(
          `Duplicate option selection for group ${selected.option_group_id}`,
        );
      }
      seenGroupIds.add(selected.option_group_id);

      const optionGroup = optionGroupById.get(selected.option_group_id);
      if (!optionGroup) {
        throw new BadRequestException(
          `Option group ${selected.option_group_id} does not belong to service ${serviceId}`,
        );
      }

      const optionValue = (optionGroup.option_values || []).find(
        (value) => value.id === selected.option_value_id,
      );

      if (!optionValue) {
        throw new BadRequestException(
          `Option value ${selected.option_value_id} does not belong to option group ${selected.option_group_id}`,
        );
      }

      optionData.push({
        option_group_id: selected.option_group_id,
        option_value_id: selected.option_value_id,
        quantity: selected.quantity || 1,
        price_adjustment: optionValue.price_adjustment || 0,
        duration_adjustment_minutes:
          optionValue.duration_adjustment_minutes || 0,
      });
    }

    if (optionData.length === 0) {
      await this.cartItemOptionRepository.removeAllForCartItem(cartItemId);
      return;
    }

    const matrixMatch =
      await this.serviceOptionPricingRulesService.evaluateBestMatch({
        serviceId,
        selections: optionData.map((option) => ({
          option_group_id: option.option_group_id,
          option_value_id: option.option_value_id,
        })),
      });

    if (matrixMatch.matched_rule_id) {
      const firstIndex = 0;
      const firstOption = optionData[firstIndex];
      optionData[firstIndex] = {
        ...firstOption,
        quantity: 1,
        price_adjustment: matrixMatch.price_adjustment,
        duration_adjustment_minutes: matrixMatch.duration_adjustment_minutes,
      };

      for (let index = 1; index < optionData.length; index += 1) {
        optionData[index] = {
          ...optionData[index],
          quantity: 1,
          price_adjustment: 0,
          duration_adjustment_minutes: 0,
        };
      }
    }

    await this.cartItemOptionRepository.syncOptions(cartItemId, optionData);
  }
}
