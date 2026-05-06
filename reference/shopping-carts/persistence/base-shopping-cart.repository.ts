import { ShoppingCart } from '@/shopping-carts/domain/shopping-cart';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { FindAllShoppingCartsDto } from '@/shopping-carts/dto/find-all-shopping-carts.dto';

/**
 * Abstract repository interface for ShoppingCart operations.
 *
 * Defines the contract for shopping cart data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseShoppingCartRepository {
  /**
   * Create a new shopping cart for a user.
   *
   * @param cart - Shopping cart domain model to create
   * @returns Promise<ShoppingCart> - Created cart
   */
  abstract create(cart: ShoppingCart): Promise<ShoppingCart>;

  /**
   * Find shopping carts with DevExtreme support.
   *
   * Supports filtering, sorting, and pagination using DevExtreme
   * load options. Used for admin/reporting interfaces.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<ShoppingCart>>
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<ShoppingCart>>;

  /**
   * Find all shopping carts with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<ShoppingCart>>
   */
  abstract findAllWithPagination(options: {
    filterQuery?: FindAllShoppingCartsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<ShoppingCart>>;

  /**
   * Find a shopping cart by user ID.
   *
   * @param userId - The user's ID
   * @param includeItems - Whether to include cart items (default: true)
   * @returns Promise<ShoppingCart | null> - Cart if found, null otherwise
   */
  abstract findByUserId(
    userId: number,
    includeItems?: boolean,
  ): Promise<ShoppingCart | null>;

  /**
   * Find a shopping cart by cart ID.
   *
   * @param id - The cart ID
   * @param includeItems - Whether to include cart items (default: true)
   * @returns Promise<ShoppingCart | null> - Cart if found, null otherwise
   */
  abstract findById(
    id: number,
    includeItems?: boolean,
  ): Promise<ShoppingCart | null>;

  /**
   * Find a shopping cart by cart ID with paginated items.
   *
   * @param id - The cart ID
   * @param itemsPage - Page number for items (1-indexed)
   * @param itemsLimit - Number of items per page
   * @returns Promise<ShoppingCart | null> - Cart with paginated items, null if not found
   */
  abstract findByIdWithPaginatedItems(
    id: number,
    itemsPage: number,
    itemsLimit: number,
  ): Promise<ShoppingCart | null>;

  /**
   * Find a shopping cart by user ID with paginated items.
   *
   * @param userId - The user's ID
   * @param itemsPage - Page number for items (1-indexed)
   * @param itemsLimit - Number of items per page
   * @returns Promise<ShoppingCart | null> - Cart with paginated items, null if not found
   */
  abstract findByUserIdWithPaginatedItems(
    userId: number,
    itemsPage: number,
    itemsLimit: number,
  ): Promise<ShoppingCart | null>;

  /**
   * Update a shopping cart.
   *
   * @param id - The cart ID
   * @param payload - Partial cart data to update
   * @returns Promise<ShoppingCart> - Updated cart
   */
  abstract update(
    id: number,
    payload: Partial<ShoppingCart>,
  ): Promise<ShoppingCart>;

  /**
   * Find a shopping cart for the mobile cart page using a slim raw query.
   *
   * Returns only product items with the ~20 columns the mobile cart page
   * actually uses. Skips all service-related joins and TypeORM full entity
   * hydration. Dramatically faster than findByUserId for large carts.
   *
   * @param userId - The user's ID
   * @returns Promise<ShoppingCart | null> - Slim cart, or null if none exists
   */
  abstract findSlimProductCartByUserId(
    userId: number,
  ): Promise<ShoppingCart | null>;

  /**
   * Soft delete a shopping cart.
   *
   * @param id - The cart ID
   * @returns Promise<void>
   */
  abstract remove(id: number): Promise<void>;
}
