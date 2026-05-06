import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ShoppingCartsService } from '@/shopping-carts/shopping-carts.service';
import { CheckoutOrdersService } from '@/checkout-orders/checkout-orders.service';
import { SalesOrdersService } from '@/sales-orders/sales-orders.service';
import { BookingsService } from '@/bookings/bookings.service';
import { ServicesService } from '@/services/services.service';
import { User } from '@/users/domain/user';
import { ShoppingCartItem } from '@/shopping-carts/domain/shopping-cart-item';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { AppointmentLocationTypeEnum } from '@/bookings/enums/appointment-location-type.enum';
import { ProcessUnifiedCheckoutDto } from './dto/process-unified-checkout.dto';
import { UnifiedCheckoutPreviewDto } from './dto/unified-checkout-preview.dto';
import {
  UnifiedCheckoutPreview,
  ServiceCheckoutPreviewItem,
} from './domain/unified-checkout-preview';
import {
  UnifiedCheckoutResult,
  UnifiedCheckoutSummary,
} from './domain/unified-checkout-result';
import { CheckoutPreviewItem } from '@/sales-orders/domain/checkout-preview';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { CreateBookingDto } from '@/bookings/dto/create-booking.dto';
import { Booking } from '@/bookings/domain/booking';
import { CartItemAddonRepository } from '@/cart-item-addons/persistence/repositories/cart-item-addon.repository';
import { CartItemOptionRepository } from '@/cart-item-options/persistence/repositories/cart-item-option.repository';
import { calculateServiceDuration } from '@/utils/helpers/calculations.helper';

/**
 * Unified Checkout Service.
 *
 * Orchestrates checkout processing for carts containing both products and services.
 * Coordinates with SalesOrdersService (for products) and BookingsService (for services)
 * to create orders atomically.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class UnifiedCheckoutService {
  constructor(
    private readonly shoppingCartsService: ShoppingCartsService,
    private readonly checkoutOrdersService: CheckoutOrdersService,
    private readonly salesOrdersService: SalesOrdersService,
    private readonly bookingsService: BookingsService,
    private readonly servicesService: ServicesService,
    private readonly dataSource: DataSource,
    private readonly cartItemAddonRepository: CartItemAddonRepository,
    private readonly cartItemOptionRepository: CartItemOptionRepository,
  ) {}

  /**
   * Get unified checkout preview for cart items.
   *
   * Shows both product and service items with pricing, availability,
   * and combined totals.
   *
   * @param user - Current authenticated user
   * @param input - Preview request DTO
   * @returns UnifiedCheckoutPreview with all item details and summary
   */
  async getUnifiedPreview(
    user: User,
    input: UnifiedCheckoutPreviewDto,
  ): Promise<UnifiedCheckoutPreview> {
    // Get user's cart with items
    const cart = await this.shoppingCartsService.getCartWithItems(user);

    // Filter only selected items
    const selectedItems = cart.items?.filter((item) => item.is_selected) || [];

    if (selectedItems.length === 0) {
      return this.buildEmptyPreview('No items selected for checkout');
    }

    // Split items by type
    const { productItems, serviceItems } = this.splitCartItems(selectedItems);

    // Build product preview (using existing SalesOrdersService logic)
    const productPreviewItems: CheckoutPreviewItem[] = [];
    const productErrors: string[] = [];
    let productSubtotal = 0;

    if (productItems.length > 0) {
      const productPreview = await this.salesOrdersService.getCheckoutPreview(
        user,
        input.delivery_address_id,
        input.shipping_method_id,
      );

      productPreviewItems.push(...productPreview.items);
      if (productPreview.errors) {
        productErrors.push(...productPreview.errors);
      }
      productSubtotal = productPreview.summary.subtotal;
    }

    // Build service preview
    const servicePreviewItems: ServiceCheckoutPreviewItem[] = [];
    const serviceErrors: string[] = [];
    let serviceSubtotal = 0;
    let baseTotal = 0;
    let addonsTotal = 0;
    let optionsTotal = 0;
    let locationFees = 0;

    for (const item of serviceItems) {
      const servicePreviewItem = await this.buildServicePreviewItem(item);
      servicePreviewItems.push(servicePreviewItem);

      if (servicePreviewItem.is_available) {
        serviceSubtotal += servicePreviewItem.total_price;
        baseTotal +=
          servicePreviewItem.unit_price * servicePreviewItem.quantity;
        addonsTotal += servicePreviewItem.addons_total || 0;
        optionsTotal += servicePreviewItem.options_total || 0;
        locationFees += servicePreviewItem.location_additional_fee || 0;
      } else if (servicePreviewItem.unavailable_reason) {
        serviceErrors.push(servicePreviewItem.unavailable_reason);
      }
    }

    // Combine all errors
    const allErrors = [...productErrors, ...serviceErrors];
    const canCheckout = allErrors.length === 0;

    // Calculate shipping (products only)
    let shippingAmount = 0;
    if (productItems.length > 0 && canCheckout) {
      const productPreview = await this.salesOrdersService.getCheckoutPreview(
        user,
        input.delivery_address_id,
        input.shipping_method_id,
      );
      shippingAmount = productPreview.summary.shipping_amount;
    }

    // Build preview response
    return {
      can_checkout: canCheckout,
      has_products: productItems.length > 0,
      has_services: serviceItems.length > 0,
      product_items: productPreviewItems,
      service_items: servicePreviewItems,
      product_summary: {
        line_count: productItems.length,
        item_count: productItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: productSubtotal,
        shipping_amount: shippingAmount,
      },
      service_summary: {
        booking_count: serviceItems.length,
        base_total: baseTotal,
        addons_total: addonsTotal,
        options_total: optionsTotal,
        location_fees: locationFees,
        subtotal: serviceSubtotal,
      },
      combined_summary: {
        subtotal: productSubtotal + serviceSubtotal,
        tax_amount: 0, // TODO: Calculate tax
        shipping_amount: shippingAmount,
        location_fees: locationFees,
        grand_total:
          productSubtotal + serviceSubtotal + shippingAmount + locationFees,
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  }

  /**
   * Process unified checkout.
   *
   * Creates checkout order, then sales order (if products) and bookings (if services)
   * in an atomic transaction.
   *
   * @param input - Process checkout DTO
   * @param user - Current authenticated user
   * @returns UnifiedCheckoutResult with created orders
   */
  async processUnifiedCheckout(
    input: ProcessUnifiedCheckoutDto,
    user: User,
  ): Promise<UnifiedCheckoutResult> {
    // Get user's cart with items
    const cart = await this.shoppingCartsService.getCartWithItems(user);

    // Filter only selected items
    const selectedItems = cart.items?.filter((item) => item.is_selected) || [];

    if (selectedItems.length === 0) {
      throw new BadRequestException('No items selected for checkout');
    }

    // Split items by type
    const { productItems, serviceItems } = this.splitCartItems(selectedItems);

    // Validate at least one item type
    if (productItems.length === 0 && serviceItems.length === 0) {
      throw new BadRequestException('No valid items in cart for checkout');
    }

    // Get preview to validate all items are available
    const preview = await this.getUnifiedPreview(user, {
      delivery_address_id: input.delivery_address_id,
      service_address_id: input.service_address_id,
      shipping_method_id: input.shipping_method_id,
    });

    if (!preview.can_checkout) {
      throw new BadRequestException(
        `Cannot checkout: ${preview.errors?.join(', ') || 'Unknown error'}`,
      );
    }

    // Create checkout order first
    const checkoutOrder = await this.checkoutOrdersService.createFromCart(
      {
        delivery_address_id: input.delivery_address_id,
        service_address_id: input.service_address_id,
        customer_notes: input.notes,
        source: 'unified_checkout',
      },
      user,
    );

    let salesOrder;
    let bookings: Booking[] = [];

    try {
      // Create sales order for products (if any)
      if (productItems.length > 0) {
        salesOrder = await this.salesOrdersService.placeOrder(
          {
            address_id: input.delivery_address_id,
            shipping_method_id: input.shipping_method_id,
            notes: input.notes,
            idempotency_key: input.idempotency_key,
          },
          user,
        );
      }

      // Create bookings for services (if any)
      if (serviceItems.length > 0) {
        bookings = await this.createBookingsFromCartItems(
          checkoutOrder.id,
          serviceItems,
          user,
        );
      }

      // Clear selected items from cart
      await this.shoppingCartsService.clearCart(user);

      // Build summary
      const summary = this.buildSummary(
        preview,
        productItems.length,
        serviceItems.length,
      );

      return {
        checkout_order: checkoutOrder,
        sales_order: salesOrder,
        bookings: bookings.length > 0 ? bookings : undefined,
        summary,
      };
    } catch (error) {
      // Note: For production, implement compensating transactions
      // to cancel the checkout order if order/booking creation fails
      throw error;
    }
  }

  /**
   * Create multiple bookings from cart service items.
   *
   * @param checkoutOrderId - The checkout order ID
   * @param serviceItems - Service items from cart
   * @param user - Current authenticated user
   * @returns Array of created bookings
   */
  private async createBookingsFromCartItems(
    checkoutOrderId: number,
    serviceItems: ShoppingCartItem[],
    user: User,
  ): Promise<Booking[]> {
    const bookings: Booking[] = [];

    for (const item of serviceItems) {
      if (!item.service_id) continue;

      const service = await this.servicesService.findById(item.service_id);

      // Format scheduled date
      const scheduledDate =
        item.scheduled_date instanceof Date
          ? item.scheduled_date.toISOString().split('T')[0]
          : String(item.scheduled_date).split('T')[0];

      // Fetch selected options and addons for this cart item to calculate total duration
      const cartItemAddons =
        await this.cartItemAddonRepository.findByCartItemIdWithAddon(item.id);
      const cartItemOptions =
        await this.cartItemOptionRepository.findByCartItemId(item.id);

      // Calculate total duration including base + options + addons
      const baseDuration = service.estimated_duration_minutes || 60;
      const optionsDuration = cartItemOptions.map((opt) => ({
        duration_adjustment_minutes: opt.duration_adjustment_minutes || 0,
        quantity: opt.quantity || 1,
      }));
      const addonsDuration = cartItemAddons.map((addon) => ({
        duration_minutes: addon.addon?.duration_minutes || 0,
        quantity: addon.quantity || 1,
      }));

      const durationMinutes = calculateServiceDuration(
        baseDuration,
        optionsDuration,
        addonsDuration,
      );

      const startMinutes = this.timeToMinutes(
        item.scheduled_start_time || '09:00:00',
      );
      const endMinutes = startMinutes + durationMinutes;
      const endTime = this.minutesToTime(endMinutes);

      // Calculate price breakdown
      const basePrice =
        item.package_id && item.package
          ? Number(item.package.price ?? 0)
          : Number(service.base_price ?? 0);
      const addonsTotal = cartItemAddons.reduce(
        (sum, addon) => sum + Number(addon.total_price ?? 0),
        0,
      );
      const optionsTotal = cartItemOptions.reduce(
        (sum, opt) =>
          sum + Number(opt.price_adjustment ?? 0) * (opt.quantity || 1),
        0,
      );
      const locationAdditionalFee = Number(item.location_additional_fee ?? 0);

      const createDto: CreateBookingDto = {
        checkout_order_id: checkoutOrderId,
        seller_id: service.seller_id,
        service_id: item.service_id,
        package_id: item.package_id || undefined,
        customer_id: user.id,
        scheduled_date: scheduledDate,
        scheduled_start_time: item.scheduled_start_time || '09:00:00',
        scheduled_end_time: item.scheduled_end_time || endTime,
        service_address_id: item.service_address_id || undefined,
        appointment_location_type:
          (item.appointment_location_type as AppointmentLocationTypeEnum) ||
          undefined,
        // Price breakdown
        base_price: basePrice,
        addons_total: addonsTotal,
        options_total: optionsTotal,
        location_additional_fee: locationAdditionalFee,
        subtotal: item.total_price || 0,
        customer_notes: item.special_requests || undefined,
      };

      const booking = await this.bookingsService.createFromCheckout(
        createDto,
        user,
      );
      bookings.push(booking);
    }

    return bookings;
  }

  /**
   * Split cart items into product and service items.
   */
  private splitCartItems(items: ShoppingCartItem[]): {
    productItems: ShoppingCartItem[];
    serviceItems: ShoppingCartItem[];
  } {
    const productItems = items.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.PRODUCT &&
        item.variant_id !== null &&
        item.variant_id !== undefined,
    );

    const serviceItems = items.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.SERVICE &&
        item.service_id !== null &&
        item.service_id !== undefined,
    );

    return { productItems, serviceItems };
  }

  /**
   * Build service preview item with availability check.
   */
  private async buildServicePreviewItem(
    item: ShoppingCartItem,
  ): Promise<ServiceCheckoutPreviewItem> {
    if (!item.service_id) {
      return this.buildUnavailableServiceItem(item, 'Service ID is missing');
    }

    try {
      const service = await this.servicesService.findById(item.service_id);

      // Check service is active
      if (service.status !== ServiceStatusEnum.ACTIVE) {
        return this.buildUnavailableServiceItem(
          item,
          `Service "${service.title}" is not available`,
        );
      }

      // Check service doesn't require quote
      if (service.requires_quote) {
        return this.buildUnavailableServiceItem(
          item,
          `Service "${service.title}" requires a custom quote`,
        );
      }

      // Get package name if applicable
      let packageName: string | null = null;
      if (item.package_id && item.package) {
        packageName = item.package.name || null;
      }

      // Format scheduled date
      const scheduledDate =
        item.scheduled_date instanceof Date
          ? item.scheduled_date.toISOString().split('T')[0]
          : String(item.scheduled_date).split('T')[0];

      // Fetch cart item addons and options for price breakdown (use entity versions for relations)
      const cartItemAddons =
        await this.cartItemAddonRepository.findByCartItemIdWithAddon(item.id);
      const cartItemOptions =
        await this.cartItemOptionRepository.findByCartItemIdWithDetails(
          item.id,
        );

      // Calculate price breakdown
      const basePrice =
        item.package_id && item.package
          ? Number(item.package.price ?? 0)
          : Number(service.base_price ?? 0);
      const addonsTotal = cartItemAddons.reduce(
        (sum, addon) => sum + Number(addon.total_price ?? 0),
        0,
      );
      const optionsTotal = cartItemOptions.reduce(
        (sum, opt) =>
          sum + Number(opt.price_adjustment ?? 0) * (opt.quantity || 1),
        0,
      );

      // Map addons for response
      const selectedAddons = cartItemAddons.map((addon) => ({
        id: addon.id,
        addon_id: addon.addon_id,
        name: addon.addon?.name || 'Unknown Addon',
        quantity: addon.quantity,
        unit_price: Number(addon.unit_price ?? 0),
        total_price: Number(addon.total_price ?? 0),
      }));

      // Map options for response
      const selectedOptions = cartItemOptions.map((opt) => ({
        id: opt.id,
        option_group_id: opt.option_group_id,
        option_value_id: opt.option_value_id,
        group_name: opt.option_group?.name || 'Unknown Group',
        value_label: opt.option_value?.label || 'Unknown Value',
        quantity: opt.quantity,
        price_adjustment: Number(opt.price_adjustment ?? 0),
      }));

      return {
        id: item.id,
        service_id: item.service_id,
        package_id: item.package_id || null,
        service_title: service.title,
        package_name: packageName,
        scheduled_date: scheduledDate,
        scheduled_start_time: item.scheduled_start_time || '',
        scheduled_end_time: null,
        quantity: item.quantity,
        unit_price: basePrice,
        addons_total: addonsTotal,
        options_total: optionsTotal,
        location_additional_fee: item.location_additional_fee || null,
        total_price: item.total_price || 0,
        selected_addons: selectedAddons.length > 0 ? selectedAddons : undefined,
        selected_options:
          selectedOptions.length > 0 ? selectedOptions : undefined,
        is_available: true,
        seller_id: service.seller_id,
      };
    } catch {
      return this.buildUnavailableServiceItem(item, 'Service not found');
    }
  }

  /**
   * Build unavailable service item response.
   */
  private buildUnavailableServiceItem(
    item: ShoppingCartItem,
    reason: string,
  ): ServiceCheckoutPreviewItem {
    const scheduledDate =
      item.scheduled_date instanceof Date
        ? item.scheduled_date.toISOString().split('T')[0]
        : String(item.scheduled_date || '').split('T')[0];

    return {
      id: item.id,
      service_id: item.service_id || 0,
      package_id: item.package_id || null,
      service_title: 'Unknown Service',
      package_name: null,
      scheduled_date: scheduledDate,
      scheduled_start_time: item.scheduled_start_time || '',
      scheduled_end_time: null,
      quantity: item.quantity,
      unit_price: 0,
      addons_total: 0,
      options_total: 0,
      location_additional_fee: null,
      total_price: 0,
      is_available: false,
      unavailable_reason: reason,
    };
  }

  /**
   * Build empty preview response.
   */
  private buildEmptyPreview(error: string): UnifiedCheckoutPreview {
    return {
      can_checkout: false,
      has_products: false,
      has_services: false,
      product_items: [],
      service_items: [],
      product_summary: {
        line_count: 0,
        item_count: 0,
        subtotal: 0,
        shipping_amount: 0,
      },
      service_summary: {
        booking_count: 0,
        base_total: 0,
        addons_total: 0,
        options_total: 0,
        location_fees: 0,
        subtotal: 0,
      },
      combined_summary: {
        subtotal: 0,
        tax_amount: 0,
        shipping_amount: 0,
        location_fees: 0,
        grand_total: 0,
      },
      errors: [error],
    };
  }

  /**
   * Build checkout summary.
   */
  private buildSummary(
    preview: UnifiedCheckoutPreview,
    productCount: number,
    serviceCount: number,
  ): UnifiedCheckoutSummary {
    return {
      total_products: productCount,
      total_services: serviceCount,
      product_subtotal: preview.product_summary.subtotal,
      service_subtotal: preview.service_summary.subtotal,
      shipping_total: preview.product_summary.shipping_amount,
      tax_total: preview.combined_summary.tax_amount,
      location_fees_total: preview.service_summary.location_fees,
      grand_total: preview.combined_summary.grand_total,
    };
  }

  /**
   * Convert time string (HH:mm:ss) to minutes.
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((v) => Number(v));
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string (HH:mm:ss).
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }
}
