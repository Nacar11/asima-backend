import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseCheckoutOrderRepository } from './persistence/base-checkout-order.repository';
import { CheckoutOrder } from './domain/checkout-order';
import { CreateCheckoutOrderDto } from './dto/create-checkout-order.dto';
import { UpdateCheckoutOrderDto } from './dto/update-checkout-order.dto';
import { QueryCheckoutOrderDto } from './dto/query-checkout-order.dto';
import { ConfirmCheckoutOrderDto } from './dto/confirm-checkout-order.dto';
import { CancelCheckoutOrderDto } from './dto/cancel-checkout-order.dto';
import { User } from '@/users/domain/user';
import { ShoppingCartsService } from '@/shopping-carts/shopping-carts.service';
import { UserAddressesService } from '@/user-addresses/user-addresses.service';
import { ServiceAreasService } from '@/service-areas/service-areas.service';
import { ShoppingCartItem } from '@/shopping-carts/domain/shopping-cart-item';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { CheckoutStatusEnum } from './enums/checkout-status.enum';
import { PaymentStatusEnum } from './enums/payment-status.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';

const MAX_ORDER_NUMBER_RETRIES = 3;

/**
 * Checkout Orders Service.
 *
 * Handles business logic for unified checkout orders that can contain
 * both products and services. Manages order creation from shopping cart,
 * total calculations, and order processing.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class CheckoutOrdersService {
  constructor(
    private readonly repository: BaseCheckoutOrderRepository,
    private readonly shoppingCartsService: ShoppingCartsService,
    private readonly userAddressesService: UserAddressesService,
    private readonly serviceAreasService: ServiceAreasService,
  ) {}

  /**
   * Create checkout order from shopping cart.
   *
   * Converts a shopping cart to a checkout order. Handles both product
   * and service items. Calculates totals and generates order number.
   *
   * @param input - Create checkout order DTO
   * @param user - Current authenticated user
   * @returns Created checkout order
   */
  async createFromCart(
    input: CreateCheckoutOrderDto,
    user: User,
  ): Promise<CheckoutOrder> {
    // 1. Get user's cart with items
    const cart = await this.shoppingCartsService.getCartWithItems(user);

    // 2. Filter only selected items
    const selectedItems = cart.items?.filter((item) => item.is_selected) || [];

    if (selectedItems.length === 0) {
      throw new BadRequestException('No items selected for checkout');
    }

    // 3. Determine order contents
    const hasProducts = selectedItems.some(
      (item) => item.item_type === CartItemTypeEnum.PRODUCT,
    );
    const hasServices = selectedItems.some(
      (item) => item.item_type === CartItemTypeEnum.SERVICE,
    );
    // TODO: Add bundle support when CartItemTypeEnum.BUNDLE is added
    const hasBundles = false;

    // 4. Get addresses
    let deliveryAddressId: number | null = null;
    let serviceAddressId: number | null = null;

    if (hasProducts && input.delivery_address_id) {
      const address = await this.userAddressesService.getAddressForCheckout(
        input.delivery_address_id,
        user.id,
      );
      deliveryAddressId = address.id;
    } else if (hasProducts) {
      const defaultAddress =
        await this.userAddressesService.getDefaultAddressForCheckout(user.id);
      deliveryAddressId = defaultAddress.id;
    }

    if (hasServices && input.service_address_id) {
      const address = await this.userAddressesService.getAddressForCheckout(
        input.service_address_id,
        user.id,
      );
      serviceAddressId = address.id;
    } else if (hasServices) {
      const defaultAddress =
        await this.userAddressesService.getDefaultAddressForCheckout(user.id);
      serviceAddressId = defaultAddress.id;
    }

    // 5. Calculate totals
    const totals = this.calculateTotals(selectedItems);

    // 6. Generate order number with retry logic
    let orderNumber: string;
    let retries = 0;
    do {
      orderNumber = this.generateOrderNumber();
      const existing = await this.repository.findByOrderNumber(orderNumber);
      if (!existing) {
        break;
      }
      retries++;
      if (retries >= MAX_ORDER_NUMBER_RETRIES) {
        throw new BadRequestException(
          'Failed to generate unique order number. Please try again.',
        );
      }
    } while (retries < MAX_ORDER_NUMBER_RETRIES);

    // 7. Create checkout order
    const checkoutOrder = new CheckoutOrder();
    checkoutOrder.user_id = user.id;
    checkoutOrder.order_number = orderNumber;
    checkoutOrder.has_products = hasProducts;
    checkoutOrder.has_services = hasServices;
    checkoutOrder.has_bundles = hasBundles;
    checkoutOrder.subtotal = totals.subtotal;
    checkoutOrder.discount_total = totals.discount_total;
    checkoutOrder.shipping_total = totals.shipping_total;
    checkoutOrder.tax_total = totals.tax_total;
    checkoutOrder.platform_fee_total = totals.platform_fee_total;
    checkoutOrder.grand_total = totals.grand_total;
    checkoutOrder.currency_id = null; // TODO: Get from cart or user preference
    checkoutOrder.status = CheckoutStatusEnum.PENDING;
    checkoutOrder.payment_status = PaymentStatusEnum.PENDING;
    checkoutOrder.delivery_address_id = deliveryAddressId;
    checkoutOrder.service_address_id = serviceAddressId;
    checkoutOrder.customer_notes = input.customer_notes || null;
    checkoutOrder.source = input.source || 'mobile_app';
    checkoutOrder.created_by = user as any;

    return this.repository.create(checkoutOrder);
  }

  /**
   * Calculate totals for checkout order.
   *
   * Calculates subtotal, discounts, shipping, tax, platform fees,
   * location-based additional fees, and grand total from cart items.
   *
   * @param items - Array of shopping cart items
   * @returns Object with calculated totals
   */
  calculateTotals(items: ShoppingCartItem[]): {
    subtotal: number;
    discount_total: number;
    shipping_total: number;
    tax_total: number;
    platform_fee_total: number;
    location_fee_total: number;
    grand_total: number;
  } {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0,
    );

    // Calculate location-based additional fees from service items
    const location_fee_total = items.reduce((sum, item) => {
      if (
        item.item_type === CartItemTypeEnum.SERVICE &&
        item.location_additional_fee
      ) {
        return sum + Number(item.location_additional_fee) * item.quantity;
      }
      return sum;
    }, 0);

    // TODO: Calculate discounts based on promo codes, coupons, etc.
    const discount_total = 0;

    // TODO: Calculate shipping for product items based on delivery address
    const shipping_total = 0;

    // TODO: Calculate tax based on location and item types
    const tax_total = 0;

    // TODO: Calculate platform fees (percentage of subtotal)
    const platform_fee_total = 0;

    const grand_total =
      subtotal +
      shipping_total +
      tax_total +
      platform_fee_total +
      location_fee_total -
      discount_total;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount_total: Math.round(discount_total * 100) / 100,
      shipping_total: Math.round(shipping_total * 100) / 100,
      tax_total: Math.round(tax_total * 100) / 100,
      platform_fee_total: Math.round(platform_fee_total * 100) / 100,
      location_fee_total: Math.round(location_fee_total * 100) / 100,
      grand_total: Math.round(grand_total * 100) / 100,
    };
  }

  /**
   * Validate location coverage for all service items.
   *
   * Checks that all service items in the checkout have valid location coverage.
   *
   * @param items - Array of shopping cart items
   * @param serviceAddress - Service address to validate against
   * @throws UnprocessableEntityException if any service is not available at the location
   */
  private async validateServiceLocationCoverage(
    items: ShoppingCartItem[],
    serviceAddress: any,
  ): Promise<void> {
    const serviceItems = items.filter(
      (item) => item.item_type === CartItemTypeEnum.SERVICE && item.service_id,
    );

    for (const item of serviceItems) {
      const coverageCheck =
        await this.serviceAreasService.checkLocationCoverage({
          service_id: item.service_id as number,
          city: serviceAddress.city,
          province: serviceAddress.province,
          postal_code: serviceAddress.postal_code,
          latitude: serviceAddress.latitude,
          longitude: serviceAddress.longitude,
        });

      if (!coverageCheck.covered) {
        throw new UnprocessableEntityException(
          `Service "${item.service?.title || item.service_id}" is not available at the specified address location`,
        );
      }
    }
  }

  /**
   * Process checkout.
   *
   * Alias for createFromCart. Can be extended with additional
   * processing logic in the future (e.g., payment processing).
   *
   * @param input - Create checkout order DTO
   * @param user - Current authenticated user
   * @returns Created checkout order
   */
  async processCheckout(
    input: CreateCheckoutOrderDto,
    user: User,
  ): Promise<CheckoutOrder> {
    return this.createFromCart(input, user);
  }

  /**
   * Generate unique order number.
   *
   * Format: ORD-YYYYMMDD-XXXX
   * Example: ORD-20241211-1234
   *
   * @returns Generated order number
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Generate 4-digit random number
    const random = Math.floor(1000 + Math.random() * 9000);

    return `ORD-${dateStr}-${random}`;
  }

  /**
   * Find checkout order by ID.
   *
   * @param id - Checkout order ID
   * @param user - Current authenticated user (for authorization)
   * @returns Checkout order if found
   */
  async findById(id: number, user: User): Promise<CheckoutOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Checkout order with ID ${id} not found`);
    }

    // Verify ownership
    if (order.user_id !== user.id) {
      throw new NotFoundException(`Checkout order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Find checkout order by ID (internal use without authorization).
   *
   * Used by payment service to send notifications.
   *
   * @param id - Checkout order ID
   * @returns Checkout order if found, null otherwise
   */
  async findByIdInternal(id: number): Promise<CheckoutOrder | null> {
    return this.repository.findById(id);
  }

  /**
   * Find checkout orders by user ID.
   *
   * @param user - Current authenticated user
   * @param query - Query parameters
   * @returns Paginated checkout orders
   */
  async findByUserId(
    user: User,
    query: QueryCheckoutOrderDto,
  ): Promise<IPaginatedResult<CheckoutOrder>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
    };

    return this.repository.findByUserId(user.id, paginationOptions);
  }

  /**
   * Update checkout order.
   *
   * @param id - Checkout order ID
   * @param input - Update DTO
   * @param user - Current authenticated user
   * @returns Updated checkout order
   */
  async update(
    id: number,
    input: UpdateCheckoutOrderDto,
    user: User,
  ): Promise<CheckoutOrder> {
    // Verify ownership
    await this.findById(id, user);

    // Update fields
    const updateData: Partial<CheckoutOrder> = {};

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.payment_status !== undefined) {
      updateData.payment_status = input.payment_status;

      // Set paid_at timestamp if payment status is PAID
      if (input.payment_status === PaymentStatusEnum.PAID) {
        updateData.paid_at = new Date();
      }
    }

    if (input.delivery_address_id !== undefined) {
      updateData.delivery_address_id = input.delivery_address_id;
    }

    if (input.service_address_id !== undefined) {
      updateData.service_address_id = input.service_address_id;
    }

    if (input.customer_notes !== undefined) {
      updateData.customer_notes = input.customer_notes;
    }

    if (input.internal_notes !== undefined) {
      updateData.internal_notes = input.internal_notes;
    }

    if (input.cancellation_reason !== undefined) {
      updateData.cancellation_reason = input.cancellation_reason;

      // Set cancelled_at timestamp if cancelling
      if (input.status === CheckoutStatusEnum.CANCELLED) {
        updateData.cancelled_at = new Date();
      }
    }

    updateData.updated_by = user as any;

    return this.repository.update(id, updateData);
  }

  /**
   * Find all checkout orders (admin only).
   *
   * @param query - Query parameters
   * @returns Paginated checkout orders
   */
  async findAll(
    query: QueryCheckoutOrderDto,
  ): Promise<IPaginatedResult<CheckoutOrder>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
    };

    return this.repository.findAllWithPagination({
      filterQuery: {
        status: query.status,
        payment_status: query.payment_status,
      },
      paginationOptions,
    });
  }

  /**
   * Confirm a checkout order.
   *
   * Transitions order status to CONFIRMED. Can optionally
   * specify payment method for processing.
   *
   * @param id - Checkout order ID
   * @param input - Confirm checkout order DTO
   * @param user - Current authenticated user
   * @returns Updated checkout order
   */
  async confirmOrder(
    id: number,
    input: ConfirmCheckoutOrderDto,
    user: User,
  ): Promise<CheckoutOrder> {
    const order = await this.findById(id, user);

    // Validate order is in PENDING status
    if (order.status !== CheckoutStatusEnum.PENDING) {
      throw new BadRequestException(
        `Cannot confirm order with status: ${order.status}. Only PENDING orders can be confirmed.`,
      );
    }

    // Build update data
    const updateData: Partial<CheckoutOrder> = {
      status: CheckoutStatusEnum.CONFIRMED,
      updated_by: user as any,
    };

    // Add notes if provided
    if (input.notes) {
      updateData.customer_notes = order.customer_notes
        ? `${order.customer_notes}\n${input.notes}`
        : input.notes;
    }

    // TODO: If payment_method is provided, integrate with payment service
    // to initiate payment processing

    return this.repository.update(id, updateData);
  }

  /**
   * Cancel a checkout order.
   *
   * Transitions order status to CANCELLED with a required
   * cancellation reason.
   *
   * @param id - Checkout order ID
   * @param input - Cancel checkout order DTO
   * @param user - Current authenticated user
   * @returns Updated checkout order
   */
  async cancelOrder(
    id: number,
    input: CancelCheckoutOrderDto,
    user: User,
  ): Promise<CheckoutOrder> {
    const order = await this.findById(id, user);

    // Validate order can be cancelled
    if (
      order.status === CheckoutStatusEnum.COMPLETED ||
      order.status === CheckoutStatusEnum.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}`,
      );
    }

    // Build cancellation reason with details
    let fullReason = input.cancellation_reason;
    if (input.cancellation_details) {
      fullReason = `${input.cancellation_reason}: ${input.cancellation_details}`;
    }

    return this.repository.update(id, {
      status: CheckoutStatusEnum.CANCELLED,
      cancellation_reason: fullReason,
      cancelled_at: new Date(),
      updated_by: user as any,
    });
  }
}
