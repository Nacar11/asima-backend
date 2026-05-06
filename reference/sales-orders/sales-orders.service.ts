import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';

// Fixed namespace UUID for generating seller-specific idempotency keys
const SELLER_IDEMPOTENCY_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, In } from 'typeorm';
import {
  BaseSalesOrderRepository,
  PaginatedSalesOrders,
} from './persistence/base-sales-order.repository';
import { SalesOrder } from './domain/sales-order';
import { OrderStatusEnum } from './domain/order-status.enum';
import {
  CheckoutPreview,
  CheckoutPreviewItem,
  SellerPickupInfo,
} from './domain/checkout-preview';
import { PlaceOrderDto } from './dto/place-order.dto';
import { PlaceOrderResponseDto } from './dto/place-order-response.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { SwitchPaymentMethodDto } from './dto/switch-payment-method.dto';
import { User } from '@/users/domain/user';
import { ShoppingCartsService } from '@/shopping-carts/shopping-carts.service';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { UserAddressesService } from '@/user-addresses/user-addresses.service';
import { UserAddress } from '@/user-addresses/domain/user-address';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { InventoryStockEntity } from '@/inventory-stocks/persistence/entities/inventory-stock.entity';
import { SalesOrderEntity } from './persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from './persistence/entities/sales-order-item.entity';
import { ShoppingCart } from '@/shopping-carts/domain/shopping-cart';
import { ShoppingCartItem } from '@/shopping-carts/domain/shopping-cart-item';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { StorageService } from '@/storage/storage.service';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';
import { ShippingService } from '@/shipping/services/shipping.service';
import { ShippingRateResponseDto } from '@/shipping/dto/shipping-rate-response.dto';
import { PickupAvailabilityService } from './pickup-availability.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { BaseInvoiceRepository } from '@/invoices/persistence/repositories/base-invoice.repository';
import { BaseServiceRepository } from '@/services/persistence/base-service.repository';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { BookingsService } from '@/bookings/bookings.service';
import { Booking } from '@/bookings/domain/booking';
import { CartItemAddonRepository } from '@/cart-item-addons/persistence/repositories/cart-item-addon.repository';
import { CartItemOptionRepository } from '@/cart-item-options/persistence/repositories/cart-item-option.repository';
import { SalesOrderItemAddonRepository } from '@/sales-order-item-addons/persistence/repositories/sales-order-item-addon.repository';
import { SalesOrderItemOptionRepository } from '@/sales-order-item-options/persistence/repositories/sales-order-item-option.repository';
import { SalesOrderItemAddonEntity } from '@/sales-order-item-addons/persistence/entities/sales-order-item-addon.entity';
import { SalesOrderItemOptionEntity } from '@/sales-order-item-options/persistence/entities/sales-order-item-option.entity';
import { calculateServiceDuration } from '@/utils/helpers/calculations.helper';
import { OrderNotificationService } from '@/notifications/services/order-notification.service';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';
import { PaymentStatusEnum } from './domain/payment-status.enum';
import { VouchersService } from '@/vouchers/vouchers.service';
import { VoucherValidationResult } from '@/vouchers/domain/voucher-validation-result';
import { ValidateVoucherDto } from '@/vouchers/dto/validate-voucher.dto';
import { Voucher } from '@/vouchers/domain/voucher';
import { CheckoutItemDto } from './dto/checkout-preview-items.dto';
import { CheckoutSessionsService } from '@/checkout-sessions/checkout-sessions.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { WalletsService } from '@/wallets/wallets.service';

const MAX_ORDER_NUMBER_RETRIES = 3;

/**
 * Sales Orders Service
 * Handles checkout and order management business logic
 */
@Injectable()
export class SalesOrdersService {
  private readonly logger = new Logger(SalesOrdersService.name);

  constructor(
    private readonly repository: BaseSalesOrderRepository,
    private readonly invoiceRepository: BaseInvoiceRepository,
    private readonly shoppingCartsService: ShoppingCartsService,
    private readonly inventoryStocksService: InventoryStocksService,
    private readonly userAddressesService: UserAddressesService,
    private readonly storageService: StorageService,
    private readonly shippingService: ShippingService,
    private readonly pickupAvailabilityService: PickupAvailabilityService,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
    private readonly dataSource: DataSource,
    private readonly orderTrackingService: OrderTrackingService,
    private readonly serviceRepository: BaseServiceRepository,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    private readonly cartItemAddonRepository: CartItemAddonRepository,
    private readonly cartItemOptionRepository: CartItemOptionRepository,
    private readonly salesOrderItemAddonRepository: SalesOrderItemAddonRepository,
    private readonly salesOrderItemOptionRepository: SalesOrderItemOptionRepository,
    private readonly orderNotificationService: OrderNotificationService,
    private readonly checkoutPaymentsService: CheckoutPaymentsService,
    private readonly vouchersService: VouchersService,
    private readonly checkoutSessionsService: CheckoutSessionsService,
    @InjectRepository(SalesOrderVoucherEntity)
    private readonly salesOrderVoucherRepository: Repository<SalesOrderVoucherEntity>,
    private readonly walletsService: WalletsService,
  ) {}

  /**
   * Get checkout preview - validates cart and shows what will be ordered
   * Only includes selected items (is_selected: true)
   * Supports both product and service items
   * Shipping is only calculated for product items
   * @param user Current authenticated user
   * @param addressId Optional address ID for shipping calculation
   * @param shippingMethodId Optional shipping method ID
   * @param voucherIds Optional array of voucher IDs to apply
   * @param voucherCode Optional voucher code to claim and apply (mutually exclusive with voucherIds)
   * @returns Checkout preview with items, availability, and totals
   */
  async getCheckoutPreview(
    user: User,
    addressId?: number,
    shippingMethodId?: number,
    voucherIds?: number[],
    voucherCode?: string,
    fulfillmentType?: 'delivery' | 'pickup',
  ): Promise<CheckoutPreview> {
    // Get user's cart with items
    const cart = await this.shoppingCartsService.getCartWithItems(user);

    // Filter selected items (products and services)
    const selectedItems =
      cart.items?.filter(
        (item) =>
          item.is_selected &&
          ((item.item_type === CartItemTypeEnum.PRODUCT &&
            item.variant_id !== null &&
            item.variant_id !== undefined) ||
            (item.item_type === CartItemTypeEnum.SERVICE &&
              item.service_id !== null &&
              item.service_id !== undefined)),
      ) || [];

    // Handle no selected items
    if (selectedItems.length === 0) {
      return {
        can_checkout: false,
        items: [],
        summary: {
          line_count: 0,
          item_count: 0,
          subtotal: 0,
          tax_amount: 0,
          shipping_amount: 0,
          total_amount: 0,
        },
        errors: [
          'No items selected for checkout. Please select products or services to proceed.',
        ],
      };
    }

    // Validate each selected item and build preview
    const previewItems: CheckoutPreviewItem[] = [];
    const errors: string[] = [];
    let subtotal = 0;

    for (const item of selectedItems) {
      const previewItem = await this.buildPreviewItem(item);
      previewItems.push(previewItem);
      subtotal += previewItem.total_price;

      if (!previewItem.is_available && previewItem.unavailable_reason) {
        errors.push(previewItem.unavailable_reason);
      }
    }

    const canCheckout = errors.length === 0;

    // Calculate shipping if items are valid (only for product items)
    let shippingAmount = 0;
    let shipping: ShippingRateResponseDto | undefined;
    const productItems = selectedItems.filter(
      (item) => item.item_type === CartItemTypeEnum.PRODUCT,
    );
    if (
      canCheckout &&
      productItems.length > 0 &&
      fulfillmentType !== 'pickup'
    ) {
      try {
        shipping = await this.calculateShippingDetailsForCheckout(
          user,
          productItems,
          subtotal,
          addressId,
          shippingMethodId,
        );

        shippingAmount = shipping?.shipping_amount ?? 0;
      } catch (error) {
        // Re-throw NotFoundException for address or shipping method issues
        if (error instanceof NotFoundException) {
          throw error;
        }
        // If shipping calculation fails, add warning but don't block checkout
        // Shipping can be calculated again at place order time
        if (error instanceof Error) {
          errors.push(`Shipping calculation: ${error.message}`);
        }
      }
    }

    // Resolve voucher IDs from voucher_code if provided
    let resolvedVoucherIds: number[] = voucherIds ?? [];
    if (voucherCode && canCheckout) {
      try {
        const userVoucher = await this.vouchersService.collectVoucherByCode(
          { voucher_code: voucherCode },
          user,
        );
        resolvedVoucherIds = [userVoucher.voucher_id];
      } catch (error) {
        if (
          error instanceof ConflictException &&
          error.message === 'Voucher already collected'
        ) {
          // Voucher already claimed, try to find it in user's vouchers and use it
          const existingVoucher =
            await this.vouchersService.findUserVoucherByCode(user, voucherCode);
          if (existingVoucher) {
            resolvedVoucherIds = [existingVoucher.voucher_id];
          } else {
            errors.push(`Voucher: ${error.message}`);
          }
        } else if (error instanceof BadRequestException) {
          const errorResponse = error.getResponse();
          const errorMessage =
            typeof errorResponse === 'object' && 'message' in errorResponse
              ? (errorResponse as { message: string }).message
              : error.message;
          errors.push(`Voucher: ${errorMessage}`);
        } else if (error instanceof NotFoundException) {
          errors.push(`Voucher: Voucher code not found`);
        } else if (error instanceof Error) {
          errors.push(`Voucher: ${error.message}`);
        }
      }
    }

    // Apply vouchers if provided
    let itemDiscountAmount = 0;
    let shippingDiscountAmount = 0;
    let hasVoucherError = false;
    let appliedVoucher: Voucher | undefined;
    if (resolvedVoucherIds.length > 0 && canCheckout) {
      try {
        const validationResult = await this.validateVouchersForCheckoutPreview(
          user,
          selectedItems,
          subtotal,
          shippingAmount,
          resolvedVoucherIds,
        );
        itemDiscountAmount = validationResult.item_discount_amount ?? 0;
        shippingDiscountAmount = validationResult.shipping_fee_discount ?? 0;
        appliedVoucher = await this.vouchersService.findById(
          resolvedVoucherIds[0],
        );
      } catch (error) {
        hasVoucherError = true;
        if (error instanceof BadRequestException) {
          const errorResponse = error.getResponse();
          const errorMessage =
            typeof errorResponse === 'object' && 'message' in errorResponse
              ? (errorResponse as { message: string }).message
              : error.message;
          errors.push(`Voucher: ${errorMessage}`);
        } else if (error instanceof Error) {
          errors.push(`Voucher: ${error.message}`);
        }
      }
    }
    const finalSubtotal = Math.max(0, subtotal - itemDiscountAmount);
    const finalShippingAmount = Math.max(
      0,
      shippingAmount - shippingDiscountAmount,
    );

    // Collect unique seller IDs from preview items and fetch pickup info
    const sellerIds = [
      ...new Set(
        previewItems
          .map((i) => i.seller_id)
          .filter((id): id is number => id != null),
      ),
    ];
    const sellers: SellerPickupInfo[] = [];
    if (sellerIds.length > 0) {
      const sellerEntities = await this.sellerRepository.find({
        where: { id: In(sellerIds) },
        relations: ['pickup_address_entity'],
      });
      for (const s of sellerEntities) {
        sellers.push({
          seller_id: s.id,
          name: s.store_name,
          phone: s.contact ?? null,
          address: s.pickup_address_entity?.address_line1 ?? null,
          latitude: s.pickup_latitude ? Number(s.pickup_latitude) : null,
          longitude: s.pickup_longitude ? Number(s.pickup_longitude) : null,
          pickup_preparation_time: s.pickup_preparation_time ?? 0,
          pickup_instructions: s.pickup_instructions ?? null,
          pickup_enabled: s.pickup_enabled ?? false,
        });
      }
    }

    return {
      can_checkout: canCheckout && !hasVoucherError,
      items: previewItems,
      sellers: sellers.length > 0 ? sellers : undefined,
      summary: {
        line_count: selectedItems.length,
        item_count: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal,
        tax_amount: 0, // TODO: Calculate tax
        shipping_amount: finalShippingAmount,
        total_amount: finalSubtotal + finalShippingAmount,
        item_discount_amount:
          itemDiscountAmount > 0 ? itemDiscountAmount : undefined,
        shipping_discount_amount:
          shippingDiscountAmount > 0 ? shippingDiscountAmount : undefined,
      },
      is_free_shipping: shipping?.is_free_shipping,
      shipping: shipping,
      errors: errors.length > 0 ? errors : undefined,
      applied_voucher: appliedVoucher,
    };
  }

  /**
   * Calculate shipping for checkout preview
   * @param user Current user
   * @param items Selected cart items
   * @param subtotal Order subtotal
   * @param addressId Optional address ID (uses default if not provided)
   * @param shippingMethodId Optional shipping method ID
   * @returns Shipping amount
   */
  private async calculateShippingForCheckout(
    user: User,
    items: ShoppingCartItem[],
    subtotal: number,
    addressId?: number,
    shippingMethodId?: number,
  ): Promise<number> {
    const result = await this.calculateShippingDetailsForCheckout(
      user,
      items,
      subtotal,
      addressId,
      shippingMethodId,
    );
    return result?.shipping_amount ?? 0;
  }

  private async calculateShippingDetailsForCheckout(
    user: User,
    items: ShoppingCartItem[],
    subtotal: number,
    addressId?: number,
    shippingMethodId?: number,
  ): Promise<ShippingRateResponseDto | undefined> {
    // Get buyer address
    let buyerAddress;
    try {
      if (addressId) {
        buyerAddress = await this.userAddressesService.getAddressForCheckout(
          addressId,
          user.id,
        );
      } else {
        buyerAddress =
          await this.userAddressesService.getDefaultAddressForCheckout(user.id);
      }
    } catch (error) {
      // Re-throw NotFoundException (indicates address doesn't belong to user - security issue)
      if (error instanceof NotFoundException) {
        throw error;
      }
      // For other errors (e.g., no default address), return undefined to allow preview without shipping
      return undefined;
    }

    // Check if buyer has coordinates
    if (!buyerAddress.latitude || !buyerAddress.longitude) {
      return undefined; // Cannot calculate without coordinates
    }

    // Get seller from first item's product
    const firstVariantId = items[0].variant_id;
    if (!firstVariantId) {
      return undefined; // Cannot calculate without variant
    }

    const firstVariant = await this.variantRepository.findOne({
      where: { id: firstVariantId },
      relations: ['product'],
    });

    if (!firstVariant?.product?.seller_id) {
      return undefined;
    }

    // Get seller with pickup coordinates
    const seller = await this.sellerRepository.findOne({
      where: { id: firstVariant.product.seller_id },
    });

    if (!seller?.pickup_latitude || !seller?.pickup_longitude) {
      return undefined; // Cannot calculate without seller coordinates
    }

    // Build shipping items from cart items
    const shippingItems = await this.buildShippingItems(items);

    try {
      const shippingResult = await this.shippingService.calculateShipping({
        items: shippingItems,
        seller_location: {
          latitude: Number(seller.pickup_latitude),
          longitude: Number(seller.pickup_longitude),
        },
        buyer_location: {
          latitude: Number(buyerAddress.latitude),
          longitude: Number(buyerAddress.longitude),
        },
        subtotal,
        shipping_method_id: shippingMethodId,
        buyer_address: {
          country: buyerAddress.country,
          province: buyerAddress.state_province,
          city: buyerAddress.city,
          postal_code: buyerAddress.postal_code,
        },
      });

      return shippingResult;
    } catch (error) {
      // Re-throw to surface shipping errors in checkout preview
      if (error instanceof Error) {
        throw error;
      }
      return undefined;
    }
  }

  /**
   * Build shipping items from cart items with variant dimensions/weight
   */
  private async buildShippingItems(items: ShoppingCartItem[]): Promise<
    Array<{
      quantity: number;
      weight_kg: number;
      length_cm?: number;
      width_cm?: number;
      height_cm?: number;
    }>
  > {
    const shippingItems: Array<{
      quantity: number;
      weight_kg: number;
      length_cm?: number;
      width_cm?: number;
      height_cm?: number;
    }> = [];

    for (const item of items) {
      if (!item.variant_id) {
        continue; // Skip items without variant
      }

      const variant = await this.variantRepository.findOne({
        where: { id: item.variant_id },
      });

      shippingItems.push({
        quantity: item.quantity,
        weight_kg: variant?.weight_kg ? Number(variant.weight_kg) : 0.5, // Default to 0.5kg if not set
        length_cm: variant?.length_cm ? Number(variant.length_cm) : undefined,
        width_cm: variant?.width_cm ? Number(variant.width_cm) : undefined,
        height_cm: variant?.height_cm ? Number(variant.height_cm) : undefined,
      });
    }

    return shippingItems;
  }

  /**
   * Build preview item with availability check
   * Supports both product and service items
   */
  private async buildPreviewItem(
    item: ShoppingCartItem,
  ): Promise<CheckoutPreviewItem> {
    // Handle product items
    if (item.item_type === CartItemTypeEnum.PRODUCT) {
      if (!item.variant_id) {
        throw new BadRequestException(
          'Variant ID is required for product items',
        );
      }

      const variant = await this.variantRepository.findOne({
        where: { id: item.variant_id },
        relations: [
          'product',
          'media',
          'product.product_media_mappings',
          'product.product_media_mappings.media',
        ],
      });

      // Extract image URLs
      const variantImageUrl = await this.getImageUrl(variant?.media);
      const productImageUrl = await this.getProductImageUrl(
        variant?.product?.product_media_mappings,
      );

      const baseItem: CheckoutPreviewItem = {
        id: item.id,
        item_type: 'product',
        variant_id: item.variant_id,
        variant_name: variant?.variant_name || 'Unknown',
        product_name: variant?.product?.product_name,
        sku: variant?.sku || 'Unknown',
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
        is_available: true,
        product_image_url: productImageUrl,
        variant_image_url: variantImageUrl,
        seller_id: variant?.product?.seller_id ?? null,
      };

      // Check variant exists
      if (!variant) {
        return {
          ...baseItem,
          is_available: false,
          unavailable_reason: `Product variant not found`,
        };
      }

      // Check variant is active
      if (variant.status !== 'Active') {
        return {
          ...baseItem,
          is_available: false,
          unavailable_reason: `${variant.variant_name} is no longer available`,
        };
      }

      // Check product is published
      if (variant.product?.status !== 'Published') {
        return {
          ...baseItem,
          is_available: false,
          unavailable_reason: `${variant.product?.product_name || 'Product'} is no longer available`,
        };
      }

      // Check stock availability
      const hasStock = await this.inventoryStocksService.checkAvailability(
        item.variant_id,
        item.quantity,
      );

      if (!hasStock) {
        return {
          ...baseItem,
          is_available: false,
          unavailable_reason: `Insufficient stock for ${variant.variant_name}`,
        };
      }

      return baseItem;
    }

    // Handle service items
    if (item.item_type === CartItemTypeEnum.SERVICE) {
      if (!item.service_id) {
        throw new BadRequestException(
          'Service ID is required for service items',
        );
      }

      const service = await this.serviceRepository.findById(item.service_id);

      // Get service image from gallery (primary image or first image)
      let serviceImageUrl: string | undefined;
      try {
        const serviceDetail = await this.serviceRepository.findDetail(
          item.service_id,
        );
        if (serviceDetail.gallery && Array.isArray(serviceDetail.gallery)) {
          // Logic matching ServiceMapper: find primary or first image
          // Note: SQL query already filters deleted_at IS NULL
          const primaryImage = serviceDetail.gallery.find(
            (img) => img.is_primary,
          );
          serviceImageUrl =
            primaryImage?.image_url || serviceDetail.gallery[0]?.image_url;
        }

        // Fallback to category image if no gallery image found
        if (
          !serviceImageUrl &&
          service &&
          (service as any).category?.image_url
        ) {
          serviceImageUrl = (service as any).category.image_url;
        }
      } catch (error) {
        // If gallery fetch fails, try category image as fallback
        if (service && (service as any).category?.image_url) {
          serviceImageUrl = (service as any).category.image_url;
        }
        console.error('Failed to fetch service gallery:', error);
      }

      const baseItem: CheckoutPreviewItem = {
        id: item.id,
        item_type: 'service',
        service_id: item.service_id,
        service_name: service?.title || 'Unknown',
        package_id: item.package_id || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
        is_available: true,
        service_image_url: serviceImageUrl,
        seller_id: (service as any)?.seller_id ?? null,
      };

      // Check service exists
      if (!service) {
        return {
          ...baseItem,
          is_available: false,
          unavailable_reason: `Service not found`,
        };
      }

      // Check service is active/published
      if (service.status !== ServiceStatusEnum.ACTIVE) {
        return {
          ...baseItem,
          is_available: false,
          unavailable_reason: `${service.title} is no longer available`,
        };
      }

      return baseItem;
    }

    // Unknown item type
    throw new BadRequestException(
      `Unsupported item type: ${item.item_type}. Only products and services are supported.`,
    );
  }

  /**
   * Place order - Convert shopping cart to sales orders
   * Only processes selected items (is_selected: true)
   * Creates SEPARATE orders per seller (items from different stores = separate orders)
   * Should be called after preview to confirm the order
   * @param input Place order DTO with optional notes, idempotency key, and address_id
   * @param user Current authenticated user
   * @returns PlaceOrderResponseDto with all created orders
   */
  async placeOrder(
    input: PlaceOrderDto,
    user: User,
  ): Promise<PlaceOrderResponseDto> {
    // 1. Check idempotency key - return existing order if found
    // Note: With multi-seller, idempotency check returns first matching order
    // This prevents duplicate order creation on retry
    if (input.idempotency_key) {
      const existingOrder = await this.repository.findByIdempotencyKey(
        input.idempotency_key,
        user.id,
      );
      if (existingOrder) {
        return new PlaceOrderResponseDto([existingOrder]);
      }
    }

    // 2. Get user's cart with items (includes calculated prices)
    const cart = await this.shoppingCartsService.getCartWithItems(user);

    // 3. Filter selected items (both products and services)
    const allSelectedItems =
      cart.items?.filter((item) => item.is_selected) || [];

    // 4. Validate selected items exist
    if (allSelectedItems.length === 0) {
      throw new BadRequestException(
        'No items selected for checkout. Please select products or services to proceed.',
      );
    }

    // 5. Filter items by type for validation
    const selectedProductItems = allSelectedItems.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.PRODUCT &&
        item.variant_id !== null &&
        item.variant_id !== undefined,
    );

    const selectedServiceItems = allSelectedItems.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.SERVICE &&
        item.service_id !== null &&
        item.service_id !== undefined,
    );

    const normalizedPaymentMethodCode = String(
      input.payment_method_code || 'cod',
    )
      .trim()
      .toLowerCase();
    const isNonCodCheckout = normalizedPaymentMethodCode !== 'cod';
    const isServiceOnlyCheckout =
      selectedProductItems.length === 0 && selectedServiceItems.length > 0;
    const shouldUseServiceManualProofFlow =
      isNonCodCheckout &&
      isServiceOnlyCheckout &&
      this.isServiceManualProofPaymentMethod(normalizedPaymentMethodCode);

    // For non-COD product or mixed checkouts, keep session flow
    // (order is created after payment callback).
    // For service-only manual-proof methods, create order immediately so
    // booking numbers exist and customer can submit proof in-app.
    if (isNonCodCheckout && !shouldUseServiceManualProofFlow) {
      return this.createCheckoutSessionFlow(input, user);
    }

    // 6. Get and validate shipping address (required for products; optional for service-only / walk-in)
    let shippingAddress: UserAddress | null = null;
    if (input.address_id) {
      shippingAddress = await this.userAddressesService.getAddressForCheckout(
        input.address_id,
        user.id,
      );
    } else if (
      selectedProductItems.length > 0 &&
      input.fulfillment_type !== 'pickup'
    ) {
      // Cart has products and not pickup: need a default address for shipping
      shippingAddress =
        await this.userAddressesService.getDefaultAddressForCheckout(user.id);
    }
    // Else: service-only / walk-in / venue / pickup — no shipping address required (shippingAddress stays null)

    // 6a. Validate pickup requirements if fulfillment_type is pickup
    if (input.fulfillment_type === 'pickup') {
      // Validate pickup_date and pickup_time are provided
      if (!input.pickup_date || !input.pickup_time) {
        throw new BadRequestException(
          'Pickup date and time are required when fulfillment type is pickup',
        );
      }

      // Validate pickup_date is within the next 7 days (not in the past, not too far ahead)
      const pickupDateObj = new Date(input.pickup_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 7);
      if (pickupDateObj < today) {
        throw new BadRequestException('Pickup date cannot be in the past');
      }
      if (pickupDateObj > maxDate) {
        throw new BadRequestException(
          'Pickup date cannot be more than 7 days in the future',
        );
      }

      // For each seller with items, validate pickup availability
      const sellerIds = new Set(
        allSelectedItems
          .map((item) => item.variant?.seller_id || item.service?.seller_id)
          .filter(Boolean),
      );

      for (const sellerId of sellerIds) {
        try {
          const availability =
            await this.pickupAvailabilityService.getAvailableSlots(
              sellerId,
              input.pickup_date,
            );

          const requestedSlot = availability.slots.find(
            (slot) => slot.time === input.pickup_time,
          );

          if (!requestedSlot || !requestedSlot.available) {
            throw new BadRequestException(
              `Pickup slot ${input.pickup_time} is not available for seller ${sellerId} on ${input.pickup_date}`,
            );
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new BadRequestException(
            `Unable to verify pickup availability for seller ${sellerId}`,
          );
        }
      }
    }

    // 7. Validate selected product items (variant active, product published, stock available)
    if (selectedProductItems.length > 0) {
      await this.validateCartItems(selectedProductItems);
    }

    // 7a. Validate all selected service items (service exists, service active)
    if (selectedServiceItems.length > 0) {
      await this.validateServiceItems(selectedServiceItems);
    }

    // 7b. Validate vouchers if provided (ownership check via user_vouchers)
    const voucherIds: number[] = input.vouchers ?? [];

    // 8. Group selected items by seller - each seller gets a separate order
    const sellerGroups = await this.groupItemsBySeller(allSelectedItems);

    // 9. Create orders for each seller group
    const createdOrders: SalesOrder[] = [];
    const createdBookingNumbers: string[] = [];

    for (const [sellerId, sellerItems] of sellerGroups) {
      // Calculate totals for this seller's items
      const {
        subtotal: originalSubtotal,
        itemCount,
        lineCount,
      } = this.calculateItemsTotals(sellerItems);

      // Filter product items for shipping calculation
      const sellerProductItems = sellerItems.filter(
        (item) =>
          item.item_type === CartItemTypeEnum.PRODUCT && item.variant_id,
      );

      // Filter service items for voucher validation
      const sellerServiceItems = sellerItems.filter(
        (item) =>
          item.item_type === CartItemTypeEnum.SERVICE && item.service_id,
      );

      // Calculate shipping (only for product items and non-pickup orders)
      let shipping: ShippingRateResponseDto | undefined;
      let originalShippingAmount = 0;
      if (
        sellerProductItems.length > 0 &&
        input.fulfillment_type !== 'pickup'
      ) {
        shipping = await this.calculateShippingDetailsForCheckout(
          user,
          sellerProductItems,
          originalSubtotal,
          input.address_id,
          input.shipping_method_id,
        );
        originalShippingAmount = shipping?.shipping_amount ?? 0;
      }
      // For pickup orders, shipping remains 0

      // Apply voucher discounts if vouchers are provided
      let subtotal = originalSubtotal;
      let shippingAmount = originalShippingAmount;
      let voucherValidationResult: VoucherValidationResult | undefined;
      if (voucherIds.length > 0) {
        voucherValidationResult = await this.validateAndApplyVouchers({
          voucherIds,
          user,
          sellerProductItems,
          sellerServiceItems,
          originalSubtotal,
          originalShippingAmount,
        });
        subtotal =
          originalSubtotal -
          (voucherValidationResult.item_discount_amount ?? 0);
        shippingAmount =
          originalShippingAmount -
          (voucherValidationResult.shipping_fee_discount ?? 0);
      }
      const totalAmount = subtotal + shippingAmount;

      // Build cart subset for this seller
      const sellerCart: ShoppingCart = {
        ...cart,
        items: sellerItems,
        summary: {
          line_count: lineCount,
          item_count: itemCount,
          subtotal: subtotal,
          tax_amount: 0,
          shipping_amount: shippingAmount,
          total_amount: totalAmount,
        },
      };

      // Generate a unique UUID for each seller's order based on the original idempotency key
      // This ensures unique orders per seller while maintaining idempotency
      const sellerIdempotencyKey = input.idempotency_key
        ? uuidv5(
            `${input.idempotency_key}_seller_${sellerId ?? 'unknown'}`,
            SELLER_IDEMPOTENCY_NAMESPACE,
          )
        : undefined;

      // Create order for this seller
      const order = await this.createOrderWithStockReservationForSeller(
        user,
        sellerCart,
        shippingAddress,
        shipping,
        sellerId,
        input.notes,
        sellerIdempotencyKey,
        input.checkout_source,
        input.fulfillment_type,
        input.pickup_date,
        input.pickup_time,
        input.pickup_notes,
      );

      if (
        voucherValidationResult &&
        (voucherValidationResult.applied_vouchers?.length ?? 0) > 0
      ) {
        const appliedVouchers = voucherValidationResult.applied_vouchers ?? [];
        const redemptionVouchers: Array<{
          voucherId: number;
          voucherCode: string;
          orderSubtotal: number;
          discountAmount: number;
        }> = appliedVouchers.map(
          (appliedVoucher: {
            is_valid: boolean;
            voucher_id: number;
            voucher_code: string;
            discount_amount: number;
            remaining_subtotal: number;
          }) => ({
            voucherId: appliedVoucher.voucher_id,
            voucherCode: appliedVoucher.voucher_code,
            orderSubtotal: originalSubtotal,
            discountAmount: appliedVoucher.discount_amount,
          }),
        );
        await this.vouchersService.recordStackedVoucherRedemptions({
          userId: user.id,
          salesOrderId: order.id,
          vouchers: redemptionVouchers,
        });
      }

      // Create ORDER_PLACED tracking event
      await this.orderTrackingService.createEvent(
        order.id,
        OrderEventTypeEnum.ORDER_PLACED,
        'Order placed successfully',
        user,
      );

      // Create bookings for service items in this order
      if (sellerServiceItems.length > 0 && order.items) {
        const bookings = await this.createBookingsForServiceItems(
          order,
          sellerServiceItems,
          user,
          input.booking_voucher_codes,
          normalizedPaymentMethodCode,
        );
        if (bookings.length > 0) {
          createdBookingNumbers.push(
            ...bookings
              .map((booking) => String(booking.booking_number || '').trim())
              .filter((bookingNumber) => bookingNumber.length > 0),
          );

          // Booking voucher discounts are applied at the booking level only.
          // Sync the order total_amount so that payment initiation and the
          // API response reflect the actual amount the customer owes.
          // Use the discount delta (subtotal − total per booking) rather than
          // replacing the order total, so product amounts are preserved in
          // mixed product+service orders.
          if (
            input.booking_voucher_codes &&
            input.booking_voucher_codes.length > 0
          ) {
            const bookingsSubtotal = bookings.reduce(
              (sum, b) => sum + Number(b.subtotal ?? 0),
              0,
            );
            const bookingsDiscountedTotal = bookings.reduce(
              (sum, b) => sum + Number(b.total ?? 0),
              0,
            );
            const voucherDiscount = bookingsSubtotal - bookingsDiscountedTotal;
            if (voucherDiscount > 0) {
              const newOrderTotal = Math.max(
                0,
                order.total_amount - voucherDiscount,
              );
              order.total_amount = newOrderTotal;
              await this.dataSource
                .getRepository(SalesOrderEntity)
                .update(order.id, { total_amount: newOrderTotal });
            }
          }
        }
      }

      // Send notification to seller about new order (skip for service-only orders;
      // the booking-created email already covers seller notification)
      if (sellerProductItems.length > 0) {
        await this.orderNotificationService.sendOrderPlacedNotification(order);
      }

      createdOrders.push(order);
    }

    // 10. Handle payment — wrapped in a transaction so payment record
    //     creation and order status updates are atomic.
    const paymentMethodCode = input.payment_method_code || 'cod';
    let paymentInfo:
      | { checkout_url?: string | null; transaction_number?: string | null }
      | undefined;

    try {
      await this.dataSource.transaction(async (transactionalManager) => {
        const grandTotal = createdOrders.reduce(
          (sum, o) => sum + o.total_amount,
          0,
        );

        if (paymentMethodCode === 'cod' || grandTotal <= 0) {
          // COD or fully discounted (100% voucher): no payment needed.
          // Fully-discounted orders are marked PAID; COD keeps existing status.
          const resolvedStatus =
            paymentMethodCode !== 'cod' && grandTotal <= 0
              ? PaymentStatusEnum.PAID
              : PaymentStatusEnum.COD;
          const resolvedMethod =
            paymentMethodCode === 'cod' ? 'cod' : paymentMethodCode;
          for (const order of createdOrders) {
            await transactionalManager
              .getRepository(SalesOrderEntity)
              .update(order.id, {
                payment_method: resolvedMethod,
                payment_status: resolvedStatus,
              });
            order.payment_method = resolvedMethod;
            order.payment_status = resolvedStatus;
          }
        } else {
          // Non-COD: initiate payment (DragonPay or Maya depending on method code)
          const primaryOrder = createdOrders[0];

          const payment = await this.checkoutPaymentsService.initiatePayment(
            {
              sales_order_id: primaryOrder.id,
              payment_method_code: paymentMethodCode,
              amount: grandTotal,
              currency_code: 'PHP',
              description: `Payment for order ${primaryOrder.order_number}`,
              ip_address: input.ip_address,
            },
            user,
          );

          paymentInfo = {
            checkout_url: payment.gateway_checkout_url,
            transaction_number: payment.transaction_number,
          };

          // Link all seller orders to the payment via join table.
          // Primary order (first seller) is already stored in the legacy
          // sales_order_id column; the join table is the source of truth for
          // multi-seller lookups.
          const paymentOrderRows = createdOrders.map((order, index) => ({
            checkout_payment_id: payment.id,
            sales_order_id: order.id,
            is_primary: index === 0,
          }));
          await transactionalManager
            .getRepository(CheckoutPaymentOrderEntity)
            .insert(paymentOrderRows);

          // Update all orders with payment info
          for (const order of createdOrders) {
            await transactionalManager
              .getRepository(SalesOrderEntity)
              .update(order.id, {
                payment_method: paymentMethodCode,
                payment_status: PaymentStatusEnum.AWAITING_PAYMENT,
              });
            order.payment_method = paymentMethodCode;
            order.payment_status = PaymentStatusEnum.AWAITING_PAYMENT;
          }
        }
      });
    } catch (error) {
      // Payment gateway failed — cancel the created orders so the user can retry.
      // Cart is NOT cleared, so items remain available for another attempt.
      for (const order of createdOrders) {
        await this.dataSource.getRepository(SalesOrderEntity).update(order.id, {
          status: OrderStatusEnum.CANCELLED,
          payment_status: PaymentStatusEnum.FAILED,
          cancelled_at: new Date(),
          status_notes: 'Payment initiation failed',
        });

        // Release the stock reservation — payment never went through.
        if (order.items) {
          for (const item of order.items) {
            if (
              item.item_type === CartItemTypeEnum.PRODUCT &&
              item.variant_id != null
            ) {
              await this.inventoryStocksService.releaseStock(
                item.variant_id,
                item.quantity,
                user,
              );
            }
          }
        }
      }
      throw error;
    }

    // 11. Clear cart for:
    // - COD orders (existing behavior)
    // - service-only manual-proof flow (bookings are already created)
    if (paymentMethodCode === 'cod' || shouldUseServiceManualProofFlow) {
      await this.shoppingCartsService.clearCart(user);
    }

    const uniqueBookingNumbers = [
      ...new Set(
        createdBookingNumbers
          .map((bookingNumber) => bookingNumber.trim())
          .filter((bookingNumber) => bookingNumber.length > 0),
      ),
    ];

    return new PlaceOrderResponseDto(
      createdOrders,
      paymentInfo,
      uniqueBookingNumbers.length > 0
        ? { booking_numbers: uniqueBookingNumbers }
        : undefined,
    );
  }

  /**
   * Create checkout session for non-COD payments.
   * Instead of creating orders immediately, we create a session that holds
   * the cart state. The actual order is created only when payment succeeds.
   *
   * @param input Place order DTO
   * @param user Current authenticated user
   * @returns PlaceOrderResponseDto with payment info and empty orders array
   */
  private async createCheckoutSessionFlow(
    input: PlaceOrderDto,
    user: User,
  ): Promise<PlaceOrderResponseDto> {
    // 1. Get user's cart with items
    const cart = await this.shoppingCartsService.getCartWithItems(user);

    // 2. Filter selected items
    const allSelectedItems =
      cart.items?.filter((item) => item.is_selected) || [];

    if (allSelectedItems.length === 0) {
      throw new BadRequestException(
        'No items selected for checkout. Please select products or services to proceed.',
      );
    }

    // 3. Validate items (products and services)
    const selectedProductItems = allSelectedItems.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.PRODUCT &&
        item.variant_id !== null &&
        item.variant_id !== undefined,
    );

    const selectedServiceItems = allSelectedItems.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.SERVICE &&
        item.service_id !== null &&
        item.service_id !== undefined,
    );

    const allSelectedServicesAreWalkInOrRemote =
      selectedServiceItems.length > 0 &&
      selectedServiceItems.every((item) => {
        const appointmentLocationType = (
          item.appointment_location_type || ''
        ).toLowerCase();
        return (
          appointmentLocationType === 'walk_in' ||
          appointmentLocationType === 'remote'
        );
      });

    // 4. Resolve shipping address.
    // Required for:
    // - Product delivery checkout
    // - Service-only checkout where at least one selected service is not walk-in/remote
    // Not required for:
    // - Pickup checkout
    // - Service-only checkout where all selected services are walk-in/remote
    let shippingAddress: UserAddress | null = null;
    const isWalkInOrRemoteServiceOnlyCheckout =
      selectedProductItems.length === 0 && allSelectedServicesAreWalkInOrRemote;
    const requiresShippingAddress =
      input.fulfillment_type !== 'pickup' &&
      !isWalkInOrRemoteServiceOnlyCheckout;
    if (input.address_id) {
      shippingAddress = await this.userAddressesService.getAddressForCheckout(
        input.address_id,
        user.id,
      );
    } else if (requiresShippingAddress) {
      shippingAddress =
        await this.userAddressesService.getDefaultAddressForCheckout(user.id);
    }

    if (selectedProductItems.length > 0) {
      await this.validateCartItems(selectedProductItems);
    }

    if (selectedServiceItems.length > 0) {
      await this.validateServiceItems(selectedServiceItems);
    }

    // 5. Calculate totals
    const { subtotal } = this.calculateItemsTotals(allSelectedItems);

    // 6. Calculate shipping (only for product items, not pickup orders)
    let shippingAmount = 0;
    if (
      selectedProductItems.length > 0 &&
      input.fulfillment_type !== 'pickup'
    ) {
      const shipping = await this.calculateShippingDetailsForCheckout(
        user,
        selectedProductItems,
        subtotal,
        input.address_id,
        input.shipping_method_id,
      );
      shippingAmount = shipping?.shipping_amount ?? 0;
    }

    const totalAmount = subtotal + shippingAmount;

    // 7. Reserve stock for product items — prevents overselling during the payment window.
    // Stock is reserved here (before payment) and released if payment fails/expires.
    // On webhook success, createOrdersFromPaymentMetadata() creates the order
    // against already-reserved stock.
    const reservedVariants: { variantId: number; quantity: number }[] = [];
    for (const item of selectedProductItems) {
      if (item.variant_id) {
        await this.inventoryStocksService.reserveStock(
          item.variant_id,
          item.quantity,
          user,
        );
        reservedVariants.push({
          variantId: item.variant_id,
          quantity: item.quantity,
        });
      }
    }

    // 8. Initiate payment with cart data in description.
    // If initiation fails, release reserved stock so items are available again.
    // The description will be parsed in the callback to create the order
    // This way, NO order exists until payment succeeds
    let payment: Awaited<
      ReturnType<typeof this.checkoutPaymentsService.initiatePayment>
    >;
    try {
      payment = await this.checkoutPaymentsService.initiatePayment(
        {
          sales_order_id: null, // No order yet - will be created in callback
          payment_method_code: input.payment_method_code || '',
          amount: totalAmount,
          currency_code: 'PHP',
          description: `Payment pending - order will be created after payment`,
          ip_address: input.ip_address,
          // Store all data needed to create order after payment succeeds
          metadata: {
            user_id: user.id,
            // Serialize as plain scalars only — no TypeORM proxy objects or
            // class instances, which can contain circular refs or lazy stubs
            // that break JSONB serialization.
            cart_items: allSelectedItems.map((item) => ({
              id: item.id,
              shopping_cart_id: item.shopping_cart_id,
              item_type: item.item_type,
              variant_id: item.variant_id ?? null,
              service_id: item.service_id ?? null,
              package_id: item.package_id ?? null,
              quantity: item.quantity,
              unit_price: Number(item.unit_price),
              total_price: Number(item.total_price),
              is_selected: item.is_selected,
              scheduled_date: item.scheduled_date ?? null,
              scheduled_start_time: item.scheduled_start_time ?? null,
              scheduled_end_time: item.scheduled_end_time ?? null,
              service_address_id: item.service_address_id ?? null,
              appointment_location_type: item.appointment_location_type ?? null,
              special_requests: item.special_requests ?? null,
              form_submission_id: item.form_submission_id ?? null,
              location_additional_fee: item.location_additional_fee ?? null,
            })),
            shipping_address_id: shippingAddress?.id ?? null,
            billing_address_id: shippingAddress?.id ?? null,
            subtotal,
            shipping_amount: shippingAmount,
            total_amount: totalAmount,
            notes: input.notes,
            shipping_method_id: input.shipping_method_id,
            checkout_source: input.checkout_source,
            idempotency_key: input.idempotency_key,
            booking_voucher_codes: input.booking_voucher_codes,
            fulfillment_type: input.fulfillment_type ?? null,
            pickup_date: input.pickup_date ?? null,
            pickup_time: input.pickup_time ?? null,
            pickup_notes: input.pickup_notes ?? null,
          },
        },
        user,
      );
    } catch (error) {
      // Payment initiation failed — release reserved stock so items are available again.
      for (const { variantId, quantity } of reservedVariants) {
        try {
          await this.inventoryStocksService.releaseStock(
            variantId,
            quantity,
            user,
          );
        } catch (releaseError) {
          this.logger.error(
            `Failed to release stock for variant ${variantId} after payment initiation failure: ${(releaseError as Error).message}`,
          );
        }
      }
      throw error;
    }

    const paymentInfo = {
      checkout_url: payment.gateway_checkout_url,
      transaction_number: payment.transaction_number,
    };

    // Return empty orders array - orders will be created in payment callback
    return new PlaceOrderResponseDto([], paymentInfo);
  }

  /**
   * Create bookings for service items in the order.
   * Each service item in the cart gets a corresponding booking.
   *
   * @param order - The created sales order with items
   * @param serviceCartItems - Original cart items (for scheduling info)
   * @param user - Current authenticated user
   */
  private async createBookingsForServiceItems(
    order: SalesOrder,
    serviceCartItems: ShoppingCartItem[],
    user: User,
    bookingVoucherCodes?: string[],
    paymentMethodCode?: string,
  ): Promise<Booking[]> {
    const bookings: Booking[] = [];

    // Get service order items from the order
    const serviceOrderItems =
      order.items?.filter(
        (item) =>
          item.item_type === CartItemTypeEnum.SERVICE && item.service_id,
      ) || [];

    for (const orderItem of serviceOrderItems) {
      // Find matching cart item for scheduling details
      const cartItem = serviceCartItems.find(
        (ci) =>
          ci.service_id === orderItem.service_id &&
          ci.package_id === orderItem.package_id,
      );

      if (!cartItem || !orderItem.service_id) continue;

      try {
        // Get service to find seller_id
        const service = await this.serviceRepository.findById(
          orderItem.service_id,
        );

        if (!service) {
          console.error(
            `Service not found for order item ${orderItem.id}, skipping booking creation`,
          );
          continue;
        }

        // Format scheduled date
        const scheduledDate =
          cartItem.scheduled_date instanceof Date
            ? cartItem.scheduled_date.toISOString().split('T')[0]
            : String(cartItem.scheduled_date).split('T')[0];

        // Fetch selected options and addons for this order item to calculate total duration
        const orderItemAddons =
          await this.salesOrderItemAddonRepository.findBySalesOrderItemId(
            orderItem.id,
          );
        const orderItemOptions =
          await this.salesOrderItemOptionRepository.findBySalesOrderItemId(
            orderItem.id,
          );

        // Calculate total duration including base + options + addons
        const baseDuration = service.estimated_duration_minutes || 60;
        const optionsDuration = orderItemOptions.map((opt) => ({
          duration_adjustment_minutes: opt.duration_adjustment_minutes || 0,
          quantity: opt.quantity || 1,
        }));
        const addonsDuration = orderItemAddons.map((addon) => ({
          duration_minutes: addon.duration_minutes || 0,
          quantity: addon.quantity || 1,
        }));

        const durationMinutes = calculateServiceDuration(
          baseDuration,
          optionsDuration,
          addonsDuration,
        );

        // Derive price breakdown so voucher discount is correctly bounded to
        // base + options only — add-ons are never covered by booking vouchers.
        const itemAddonsTotal = orderItemAddons.reduce(
          (sum, a) => sum + Number(a.total_price ?? 0),
          0,
        );
        const itemOptionsTotal = orderItemOptions.reduce(
          (sum, o) => sum + Number(o.price_adjustment ?? 0) * (o.quantity || 1),
          0,
        );
        const itemBasePrice = Math.max(
          0,
          Number(orderItem.total_price) - itemAddonsTotal - itemOptionsTotal,
        );

        // For venue bookings, use the customer-specified end time from the cart
        // (covers the full slot range). For other services, calculate from duration.
        let endTime: string;
        if (cartItem.scheduled_end_time) {
          endTime = cartItem.scheduled_end_time;
        } else {
          const startMinutes = this.timeToMinutes(
            cartItem.scheduled_start_time || '09:00:00',
          );
          const endMinutes = startMinutes + durationMinutes;
          endTime = this.minutesToTime(endMinutes);
        }

        const booking = await this.bookingsService.createFromSalesOrderItem({
          salesOrderId: order.id,
          salesOrderItemId: orderItem.id,
          serviceId: orderItem.service_id,
          sellerId: service.seller_id,
          packageId: orderItem.package_id || null,
          scheduledDate,
          scheduledStartTime: cartItem.scheduled_start_time || '09:00:00',
          scheduledEndTime: endTime,
          serviceAddressId: cartItem.service_address_id || null,
          appointmentLocationType:
            (cartItem as any).appointment_location_type || null,
          subtotal: Number(orderItem.total_price) || 0,
          addonsTotal: itemAddonsTotal,
          optionsTotal: itemOptionsTotal,
          basePrice: itemBasePrice,
          customerNotes: cartItem.special_requests || null,
          formSubmissionId: cartItem.form_submission_id || null,
          user,
          voucherCodes: bookingVoucherCodes,
          guestEmail: user.email,
          sendCreationEmails: true,
          paymentMethodCode: paymentMethodCode || null,
        });

        bookings.push(booking);
      } catch (error) {
        // Log error but don't fail the order creation
        console.error(
          `Failed to create booking for service item ${orderItem.id}:`,
          error,
        );
      }
    }

    return bookings;
  }

  /**
   * Convert time string (HH:mm:ss) to minutes from midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes from midnight to time string (HH:mm:ss)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
  }

  /**
   * Create order and reserve stock in a single transaction with retry logic
   * Handles order number collisions by generating new numbers and retrying
   * @deprecated Use createOrderWithStockReservationForSeller instead
   */
  private async createOrderWithStockReservation(
    user: User,
    cart: ShoppingCart,
    shippingAddress: UserAddress,
    shipping: ShippingRateResponseDto | undefined,
    notes?: string,
    idempotencyKey?: string,
  ): Promise<SalesOrder> {
    // Derive seller_id from first item (legacy behavior)
    let sellerId: number | null = null;
    if (cart.items && cart.items.length > 0) {
      const firstProductItem = cart.items.find(
        (item) =>
          item.item_type === CartItemTypeEnum.PRODUCT && item.variant_id,
      );
      if (firstProductItem?.variant_id) {
        const variant = await this.variantRepository.findOne({
          where: { id: firstProductItem.variant_id },
          relations: ['product'],
        });
        if (variant?.product?.seller_id) {
          sellerId = variant.product.seller_id;
        }
      } else {
        const firstServiceItem = cart.items.find(
          (item) =>
            item.item_type === CartItemTypeEnum.SERVICE && item.service_id,
        );
        if (firstServiceItem?.service_id) {
          const service = await this.serviceRepository.findById(
            firstServiceItem.service_id,
          );
          if (service?.seller_id) {
            sellerId = service.seller_id;
          }
        }
      }
    }

    return this.createOrderWithStockReservationForSeller(
      user,
      cart,
      shippingAddress,
      shipping,
      sellerId,
      notes,
      idempotencyKey,
    );
  }

  /**
   * Create order for a specific seller and reserve stock in a single transaction
   * Handles order number collisions by generating new numbers and retrying
   */
  private async createOrderWithStockReservationForSeller(
    user: User,
    cart: ShoppingCart,
    shippingAddress: UserAddress | null,
    shipping: ShippingRateResponseDto | undefined,
    sellerId: number | null,
    notes?: string,
    idempotencyKey?: string,
    checkoutSource?: string,
    fulfillmentType?: 'delivery' | 'pickup',
    pickupDate?: string,
    pickupTime?: string,
    pickupNotes?: string,
  ): Promise<SalesOrder> {
    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_RETRIES; attempt++) {
      const orderNumber = this.generateOrderNumber();

      try {
        return await this.executeCheckoutTransactionForSeller(
          user,
          orderNumber,
          cart,
          shippingAddress,
          shipping,
          sellerId,
          notes,
          idempotencyKey,
          checkoutSource,
          fulfillmentType,
          pickupDate,
          pickupTime,
          pickupNotes,
        );
      } catch (error) {
        // Check if this is a unique constraint violation on order_number
        if (this.isOrderNumberCollision(error)) {
          continue; // Retry with a new order number
        }
        // For any other error, throw immediately
        throw error;
      }
    }

    // All retries exhausted
    throw new ConflictException(
      `Failed to generate unique order number after ${MAX_ORDER_NUMBER_RETRIES} attempts. Please try again.`,
    );
  }

  /**
   * Execute the checkout transaction (order creation + stock reservation)
   * @deprecated Use executeCheckoutTransactionForSeller instead
   */
  private async executeCheckoutTransaction(
    user: User,
    orderNumber: string,
    cart: ShoppingCart,
    shippingAddress: UserAddress,
    shipping: ShippingRateResponseDto | undefined,
    notes?: string,
    idempotencyKey?: string,
  ): Promise<SalesOrder> {
    // Derive seller_id from first item (legacy behavior)
    let sellerId: number | null = null;
    if (cart.items && cart.items.length > 0) {
      const firstProductItem = cart.items.find(
        (item) =>
          item.item_type === CartItemTypeEnum.PRODUCT && item.variant_id,
      );
      if (firstProductItem?.variant_id) {
        const variant = await this.variantRepository.findOne({
          where: { id: firstProductItem.variant_id },
          relations: ['product'],
        });
        if (variant?.product?.seller_id) {
          sellerId = variant.product.seller_id;
        }
      } else {
        const firstServiceItem = cart.items.find(
          (item) =>
            item.item_type === CartItemTypeEnum.SERVICE && item.service_id,
        );
        if (firstServiceItem?.service_id) {
          const service = await this.serviceRepository.findById(
            firstServiceItem.service_id,
          );
          if (service?.seller_id) {
            sellerId = service.seller_id;
          }
        }
      }
    }

    return this.executeCheckoutTransactionForSeller(
      user,
      orderNumber,
      cart,
      shippingAddress,
      shipping,
      sellerId,
      notes,
      idempotencyKey,
    );
  }

  /**
   * Execute the checkout transaction for a specific seller (order creation + stock reservation)
   */
  private async executeCheckoutTransactionForSeller(
    user: User,
    orderNumber: string,
    cart: ShoppingCart,
    shippingAddress: UserAddress | null,
    shipping: ShippingRateResponseDto | undefined,
    sellerId: number | null,
    notes?: string,
    idempotencyKey?: string,
    checkoutSource?: string,
    fulfillmentType?: 'delivery' | 'pickup',
    pickupDate?: string,
    pickupTime?: string,
    pickupNotes?: string,
  ): Promise<SalesOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Build legacy shipping_address text (null for walk-in / service-only)
      const legacyShippingAddress = shippingAddress
        ? this.buildLegacyShippingAddress(shippingAddress)
        : null;

      // Snapshot commission rate at order placement so wallet credits use the
      // rate that was in effect when the customer paid, not whatever it is later.
      let snapshotCommissionRate = 0;
      if (sellerId) {
        const sellerForRate = await queryRunner.manager
          .getRepository(SellerEntity)
          .findOne({ where: { id: sellerId }, select: ['commission_rate'] });
        snapshotCommissionRate = Number(sellerForRate?.commission_rate ?? 0);
      }

      // Create order entity with shipping address snapshot (per PRD section 5).
      // Order starts as PENDING — seller must confirm item availability before processing.
      // When shippingAddress is null (service-only / walk-in), all shipping fields are null.
      const orderEntity = queryRunner.manager.create(SalesOrderEntity, {
        user_id: user.id,
        seller_id: sellerId,
        order_number: orderNumber,
        idempotency_key: idempotencyKey || null,
        status: OrderStatusEnum.PENDING,
        subtotal: cart.summary?.subtotal || 0,
        tax_amount: cart.summary?.tax_amount || 0,
        shipping_amount: cart.summary?.shipping_amount || 0,
        total_amount: cart.summary?.total_amount || 0,
        commission_rate: snapshotCommissionRate,
        notes: notes || null,
        // Legacy text field for backward compatibility
        shipping_address: legacyShippingAddress,
        // Shipping address snapshot fields (null when walk-in / service-only)
        user_address_id: shippingAddress?.id ?? null,
        shipping_recipient_name: shippingAddress?.recipient_name ?? null,
        shipping_phone: shippingAddress?.phone ?? null,
        shipping_address_line1: shippingAddress?.address_line1 ?? null,
        shipping_address_line2: shippingAddress?.address_line2 ?? null,
        shipping_city: shippingAddress?.city ?? null,
        shipping_state_province: shippingAddress?.state_province ?? null,
        shipping_postal_code: shippingAddress?.postal_code ?? null,
        shipping_country: shippingAddress?.country ?? null,
        shipping_method: shipping?.method_name ?? null,
        shipping_provider: shipping?.provider_name ?? null,
        checkout_source: checkoutSource || null,
        fulfillment_type: fulfillmentType || 'delivery',
        pickup_date: pickupDate ? new Date(pickupDate) : null,
        pickup_time: pickupTime || null,
        pickup_notes: pickupNotes || null,
        created_by: { id: user.id },
        updated_by: { id: user.id },
      });
      const savedOrder = await queryRunner.manager.save(orderEntity);

      // Create order items (both product and service items)
      const orderItems = cart.items!.map((cartItem) => {
        const itemEntity = queryRunner.manager.create(SalesOrderItemEntity, {
          order_id: savedOrder.id,
          item_type: cartItem.item_type,
          variant_id:
            cartItem.item_type === CartItemTypeEnum.PRODUCT
              ? (cartItem.variant_id ?? null)
              : null,
          service_id:
            cartItem.item_type === CartItemTypeEnum.SERVICE
              ? (cartItem.service_id ?? null)
              : null,
          package_id:
            cartItem.item_type === CartItemTypeEnum.SERVICE
              ? (cartItem.package_id ?? null)
              : null,
          quantity: cartItem.quantity,
          unit_price: cartItem.unit_price || 0,
          total_price: cartItem.total_price || 0,
          scheduled_date:
            cartItem.item_type === CartItemTypeEnum.SERVICE
              ? (cartItem.scheduled_date ?? null)
              : null,
          scheduled_start_time:
            cartItem.item_type === CartItemTypeEnum.SERVICE
              ? (cartItem.scheduled_start_time ?? null)
              : null,
          service_address_id:
            cartItem.item_type === CartItemTypeEnum.SERVICE
              ? (cartItem.service_address_id ?? null)
              : null,
          special_requests:
            cartItem.item_type === CartItemTypeEnum.SERVICE
              ? (cartItem.special_requests ?? null)
              : null,
          location_additional_fee:
            cartItem.item_type === CartItemTypeEnum.SERVICE
              ? (cartItem.location_additional_fee ?? null)
              : null,
          created_by: { id: user.id },
          updated_by: { id: user.id },
        });
        return itemEntity;
      });
      const savedOrderItems = await queryRunner.manager.save(orderItems);

      // Copy addons and options from cart to sales order items for service items
      await this.copyCartAddonsOptionsToOrderItems(
        queryRunner,
        cart.items!,
        savedOrderItems,
        user,
      );

      // Reserve stock for each item WITHIN the same transaction
      await this.reserveStockInTransaction(queryRunner, cart.items!, user);

      await queryRunner.commitTransaction();

      // Fetch with relations
      return this.repository.findById(savedOrder.id) as Promise<SalesOrder>;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Copy cart addons and options to sales order items as snapshots.
   * This preserves the add-on/option data even if the original is later modified or deleted.
   *
   * @param queryRunner - Active query runner for transaction
   * @param cartItems - Original cart items with IDs
   * @param savedOrderItems - Saved order item entities with IDs
   * @param user - Current user for audit
   */
  private async copyCartAddonsOptionsToOrderItems(
    queryRunner: QueryRunner,
    cartItems: ShoppingCartItem[],
    savedOrderItems: SalesOrderItemEntity[],
    user: User,
  ): Promise<void> {
    // Build a map from cart item to order item for service items
    const cartToOrderMap = new Map<number, SalesOrderItemEntity>();
    for (const orderItem of savedOrderItems) {
      if (orderItem.item_type !== CartItemTypeEnum.SERVICE) continue;

      // Find matching cart item by service_id and package_id
      const cartItem = cartItems.find(
        (ci) =>
          ci.item_type === CartItemTypeEnum.SERVICE &&
          ci.service_id === orderItem.service_id &&
          ci.package_id === orderItem.package_id,
      );
      if (cartItem) {
        cartToOrderMap.set(cartItem.id, orderItem);
      }
    }

    if (cartToOrderMap.size === 0) return;

    // Get all cart addons and options for service items
    const cartItemIds = Array.from(cartToOrderMap.keys());

    // Fetch cart addons with their addon details for all cart items
    const allCartAddons: Awaited<
      ReturnType<typeof this.cartItemAddonRepository.findByCartItemIdWithAddon>
    > = [];
    for (const cartItemId of cartItemIds) {
      const addons =
        await this.cartItemAddonRepository.findByCartItemIdWithAddon(
          cartItemId,
        );
      allCartAddons.push(...addons);
    }

    // Fetch cart options with their option group and value details
    const allCartOptions: Awaited<
      ReturnType<
        typeof this.cartItemOptionRepository.findByCartItemIdWithDetails
      >
    > = [];
    for (const cartItemId of cartItemIds) {
      const options =
        await this.cartItemOptionRepository.findByCartItemIdWithDetails(
          cartItemId,
        );
      allCartOptions.push(...options);
    }

    // Create sales order item addon snapshots
    const addonSnapshots: Partial<SalesOrderItemAddonEntity>[] = [];
    for (const cartAddon of allCartAddons) {
      const orderItem = cartToOrderMap.get(cartAddon.cart_item_id);
      if (!orderItem || !cartAddon.addon) continue;

      addonSnapshots.push({
        sales_order_item_id: orderItem.id,
        addon_id: cartAddon.addon_id,
        addon_name: cartAddon.addon.name,
        addon_code: cartAddon.addon.code,
        addon_description: cartAddon.addon.description,
        unit_type: cartAddon.addon.unit_type,
        quantity: cartAddon.quantity,
        unit_price: Number(cartAddon.unit_price),
        total_price: Number(cartAddon.total_price),
        duration_minutes: cartAddon.addon.duration_minutes,
        created_by: { id: user.id } as any,
        updated_by: { id: user.id } as any,
      });
    }

    if (addonSnapshots.length > 0) {
      await queryRunner.manager.save(
        SalesOrderItemAddonEntity,
        addonSnapshots.map((s) =>
          queryRunner.manager.create(SalesOrderItemAddonEntity, s),
        ),
      );
    }

    // Create sales order item option snapshots
    const optionSnapshots: Partial<SalesOrderItemOptionEntity>[] = [];
    for (const cartOption of allCartOptions) {
      const orderItem = cartToOrderMap.get(cartOption.cart_item_id);
      if (!orderItem || !cartOption.option_group || !cartOption.option_value)
        continue;

      optionSnapshots.push({
        sales_order_item_id: orderItem.id,
        option_group_id: cartOption.option_group_id,
        option_value_id: cartOption.option_value_id,
        group_name: cartOption.option_group.name,
        group_code: cartOption.option_group.code,
        value_label: cartOption.option_value.label,
        value_code: cartOption.option_value.value,
        quantity: cartOption.quantity,
        price_adjustment: Number(cartOption.price_adjustment),
        duration_adjustment_minutes: cartOption.duration_adjustment_minutes,
        created_by: { id: user.id } as any,
        updated_by: { id: user.id } as any,
      });
    }

    if (optionSnapshots.length > 0) {
      await queryRunner.manager.save(
        SalesOrderItemOptionEntity,
        optionSnapshots.map((s) =>
          queryRunner.manager.create(SalesOrderItemOptionEntity, s),
        ),
      );
    }
  }

  /**
   * Reserve stock within a transaction
   * Only increases reserved_quantity - available_quantity stays the same until shipped
   * Purchasable quantity = available_quantity - reserved_quantity
   */
  private async reserveStockInTransaction(
    queryRunner: QueryRunner,
    items: ShoppingCartItem[],
    user: User,
  ): Promise<void> {
    for (const item of items) {
      // Only process product items with variant_id
      if (!item.variant_id || item.item_type !== CartItemTypeEnum.PRODUCT) {
        continue;
      }

      const stock = await queryRunner.manager
        .getRepository(InventoryStockEntity)
        .createQueryBuilder('stock')
        .setLock('pessimistic_write')
        .where('stock.variant_id = :variantId', {
          variantId: item.variant_id,
        })
        .getOne();

      if (!stock) {
        // No stock record - skip reservation (unlimited stock)
        continue;
      }

      const newReservedQuantity = stock.reserved_quantity + item.quantity;
      // available_quantity stays the same - only reserved_quantity increases
      // stock_quantity stays the same (stock_on_hand + available_quantity)

      await queryRunner.manager.update(InventoryStockEntity, stock.id, {
        reserved_quantity: newReservedQuantity,
        updated_by: { id: user.id } as any,
      });
    }
  }

  private async rehydrateCartItemsFromLiveData(
    cartItems: ShoppingCartItem[],
  ): Promise<ShoppingCartItem[]> {
    const hydratedItems: ShoppingCartItem[] = [];

    for (const cartItem of cartItems) {
      if (
        cartItem.item_type !== CartItemTypeEnum.PRODUCT ||
        !cartItem.variant_id
      ) {
        hydratedItems.push(cartItem);
        continue;
      }

      const variant = await this.variantRepository.findOne({
        where: { id: cartItem.variant_id },
        relations: ['product'],
      });

      if (!variant) {
        throw new NotFoundException(
          `Product variant ${cartItem.variant_id} not found`,
        );
      }

      const liveUnitPrice = Number(variant.selling_price);
      hydratedItems.push({
        ...cartItem,
        unit_price: liveUnitPrice,
        total_price: liveUnitPrice * cartItem.quantity,
      });
    }

    return hydratedItems;
  }

  /**
   * Check if error is an order number collision (unique constraint violation)
   */
  private isOrderNumberCollision(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // PostgreSQL unique violation
      return (
        message.includes('duplicate key') && message.includes('order_number')
      );
    }
    return false;
  }

  /**
   * Find order by ID (current user only)
   * @param id Order ID
   * @param user Current user (for authorization)
   * @returns Sales order
   */
  async findById(id: number, user: User): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only owner can view (admins should use admin endpoint)
    if (order.user_id !== user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }
    const invoice = await this.invoiceRepository.findByOrderId(id);
    const transformedOrder = await this.transformOrderImageUrls(order);
    transformedOrder.invoice_id = invoice ? invoice.id : null;

    const voucherRecord = await this.salesOrderVoucherRepository.findOne({
      where: { sales_order_id: id },
    });
    transformedOrder.voucher = voucherRecord
      ? {
          id: voucherRecord.id,
          sales_order_id: voucherRecord.sales_order_id,
          user_voucher_id: voucherRecord.user_voucher_id,
          voucher_code: voucherRecord.voucher_code,
          voucher_discount: Number(voucherRecord.voucher_discount),
          created_at: voucherRecord.created_at,
        }
      : null;

    return transformedOrder;
  }

  /**
   * Get payment status for a sales order (lightweight, no relations loaded).
   * Designed for mobile polling after online payment.
   */
  async getPaymentStatus(
    id: number,
    user: User,
  ): Promise<{ payment_status: string; order_number: string }> {
    const order = await this.dataSource
      .getRepository(SalesOrderEntity)
      .findOne({
        where: { id },
        select: ['id', 'user_id', 'order_number', 'payment_status'],
      });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.user_id !== user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return {
      payment_status: order.payment_status,
      order_number: order.order_number,
    };
  }

  /**
   * Create sales orders from the metadata snapshot stored at payment initiation.
   *
   * This is the core of the Amazon-style checkout model: no order is created
   * when the user clicks "Pay". Instead, the cart state is snapshotted into the
   * payment record's metadata. When the payment gateway sends the success callback,
   * this method replays the full order-creation flow from that snapshot.
   *
   * Called by CheckoutPaymentsService.handlePaymentCallback() on success.
   * Returns the IDs of all created orders, which the caller links to the payment
   * via checkout_payment_orders and then clears the user's cart.
   *
   * @param payment - The completed payment record
   * @param metadata - Typed metadata extracted from the payment record
   */
  async createOrdersFromPaymentMetadata(
    payment: {
      id: number;
      transaction_number?: string | null;
      payment_method_code?: string | null;
    },
    metadata: {
      user_id: number;
      cart_items: ShoppingCartItem[];
      shipping_address_id: number | null;
      subtotal: number;
      shipping_amount: number;
      total_amount: number;
      notes?: string;
      shipping_method_id?: number;
      checkout_source?: string;
      idempotency_key?: string;
      booking_voucher_codes?: string[];
      fulfillment_type?: 'delivery' | 'pickup' | null;
      pickup_date?: string | null;
      pickup_time?: string | null;
      pickup_notes?: string | null;
    },
    initialPaymentStatus: 'paid' | 'awaiting_payment' = 'paid',
  ): Promise<number[]> {
    // 1. Load full user to avoid unsafe stub objects in downstream services
    const userEntity = await this.dataSource.getRepository(UserEntity).findOne({
      where: { id: metadata.user_id },
    });

    if (!userEntity) {
      throw new NotFoundException(`User with ID ${metadata.user_id} not found`);
    }

    const user = userEntity as unknown as User;

    const currentCartItems = await this.rehydrateCartItemsFromLiveData(
      metadata.cart_items,
    );

    // 2. Load the shipping address (not required for pickup orders)
    let shippingAddress: UserAddress | null = null;
    if (
      metadata.fulfillment_type !== 'pickup' &&
      metadata.shipping_address_id
    ) {
      shippingAddress = await this.userAddressesService.getAddressForCheckout(
        metadata.shipping_address_id,
        metadata.user_id,
      );
    }

    // 3. Re-validate items are still available (stock could have changed)
    const productItems = currentCartItems.filter(
      (item) => item.item_type === CartItemTypeEnum.PRODUCT && item.variant_id,
    );
    const serviceItems = currentCartItems.filter(
      (item) => item.item_type === CartItemTypeEnum.SERVICE && item.service_id,
    );

    if (productItems.length > 0) {
      await this.validateCartItems(productItems);
    }
    if (serviceItems.length > 0) {
      await this.validateServiceItems(serviceItems);
    }

    // 4. Group items by seller — one order per seller (same as normal checkout)
    const sellerGroups = await this.groupItemsBySeller(currentCartItems);

    const createdOrderIds: number[] = [];

    for (const [sellerId, sellerItems] of sellerGroups) {
      const { subtotal, itemCount, lineCount } =
        this.calculateItemsTotals(sellerItems);

      // Recalculate shipping per seller (skip for pickup orders)
      const sellerProductItems = sellerItems.filter(
        (item) =>
          item.item_type === CartItemTypeEnum.PRODUCT && item.variant_id,
      );
      let shippingRate: ShippingRateResponseDto | undefined;
      let shippingAmount = 0;
      if (
        sellerProductItems.length > 0 &&
        metadata.fulfillment_type !== 'pickup'
      ) {
        shippingRate = await this.calculateShippingDetailsForCheckout(
          user,
          sellerProductItems,
          subtotal,
          metadata.shipping_address_id ?? undefined,
          metadata.shipping_method_id,
        );
        shippingAmount = shippingRate?.shipping_amount ?? 0;
      }

      // Build a minimal ShoppingCart shape for createOrderWithStockReservationForSeller
      const sellerCart: ShoppingCart = {
        id: 0,
        user_id: metadata.user_id,
        items: sellerItems,
        summary: {
          line_count: lineCount,
          item_count: itemCount,
          subtotal,
          tax_amount: 0,
          shipping_amount: shippingAmount,
          total_amount: subtotal + shippingAmount,
        },
      } as ShoppingCart;

      // Use idempotency key scoped per seller to prevent duplicate orders on retry
      const sellerIdempotencyKey = metadata.idempotency_key
        ? uuidv5(
            `${metadata.idempotency_key}_seller_${sellerId ?? 'unknown'}`,
            SELLER_IDEMPOTENCY_NAMESPACE,
          )
        : undefined;

      const order = await this.createOrderWithStockReservationForSeller(
        user,
        sellerCart,
        shippingAddress,
        shippingRate,
        sellerId,
        metadata.notes,
        sellerIdempotencyKey,
        metadata.checkout_source,
        metadata.fulfillment_type ?? undefined,
        metadata.pickup_date ?? undefined,
        metadata.pickup_time ?? undefined,
        metadata.pickup_notes ?? undefined,
      );

      // Set payment info on the order.
      // awaiting_payment → order PENDING, payment AWAITING_PAYMENT (manual GCash: admin confirms later)
      // paid            → order CONFIRMED, payment PAID (Maya webhook: already succeeded)
      const isPaid = initialPaymentStatus === 'paid';
      await this.dataSource.getRepository(SalesOrderEntity).update(order.id, {
        payment_method: payment.payment_method_code ?? 'online',
        payment_status: isPaid
          ? PaymentStatusEnum.PAID
          : PaymentStatusEnum.AWAITING_PAYMENT,
        status: isPaid ? OrderStatusEnum.CONFIRMED : OrderStatusEnum.PENDING,
      });

      // Link this order to the payment via the join table
      await this.dataSource.getRepository(CheckoutPaymentOrderEntity).insert({
        checkout_payment_id: payment.id,
        sales_order_id: order.id,
        is_primary: createdOrderIds.length === 0,
      });

      // Create ORDER_PLACED tracking event
      await this.orderTrackingService.createEvent(
        order.id,
        OrderEventTypeEnum.ORDER_PLACED,
        'Order placed after successful payment',
        user,
      );

      // Create bookings for service items
      const sellerServiceItems = sellerItems.filter(
        (item) =>
          item.item_type === CartItemTypeEnum.SERVICE && item.service_id,
      );
      if (sellerServiceItems.length > 0 && order.items) {
        await this.createBookingsForServiceItems(
          order,
          sellerServiceItems,
          user,
          metadata.booking_voucher_codes,
        );
      }

      // Notify seller of new order (skip for service-only orders;
      // the booking-created email already covers seller notification)
      if (sellerProductItems.length > 0) {
        await this.orderNotificationService.sendOrderPlacedNotification(order);
      }

      // Credit pending earnings to seller wallet only when payment is confirmed.
      // For manual GCash (awaiting_payment), wallet credit happens in confirmManualPayment
      // via updateSalesOrderPaymentStatus → creditPendingEarning.
      if (isPaid && sellerId) {
        try {
          await this.walletsService.creditPendingEarning(
            sellerId,
            order.id,
            order.subtotal,
            Number(order.commission_rate ?? 0),
          );
        } catch (e) {
          // Non-fatal: log but don't fail the order creation
          this.logger.warn(
            `Failed to credit pending earning for seller ${sellerId}, order ${order.id}: ${(e as Error).message}`,
          );
        }
      }

      createdOrderIds.push(order.id);
    }

    return createdOrderIds;
  }

  /**
   * Switch or retry payment method for an order that is awaiting or failed payment.
   *
   * Allows a customer to change from one payment method to another (e.g., gcash → cod,
   * or retry a failed dragonpay payment with a new method) without losing the order.
   *
   * Flow:
   * 1. Validate order ownership and payment status (must be AWAITING_PAYMENT or FAILED).
   * 2. Cancel any pending/awaiting payment records linked to this order.
   * 3. If switching to COD: update order payment_method and payment_status directly.
   * 4. If switching to non-COD: initiate a new DragonPay payment and return the checkout URL.
   *
   * @param id Sales order ID
   * @param input New payment method and optional IP address
   * @param user Current authenticated user
   */
  async switchPaymentMethod(
    id: number,
    input: SwitchPaymentMethodDto,
    user: User,
  ): Promise<{
    checkout_url: string | null;
    payment_transaction_number: string | null;
  }> {
    const order = await this.dataSource
      .getRepository(SalesOrderEntity)
      .findOne({
        where: { id },
        select: [
          'id',
          'user_id',
          'order_number',
          'payment_status',
          'payment_method',
          'total_amount',
          'status',
        ],
      });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.user_id !== user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Only allow retrying when order is waiting for or has failed payment
    const retryableStatuses = [
      PaymentStatusEnum.AWAITING_PAYMENT,
      PaymentStatusEnum.FAILED,
    ];
    if (
      !retryableStatuses.includes(order.payment_status as PaymentStatusEnum)
    ) {
      throw new BadRequestException(
        `Cannot change payment method for an order with payment status "${order.payment_status}". Only orders with awaiting_payment or failed payment can be retried.`,
      );
    }

    // Cancel any outstanding pending/awaiting payment records linked to this order
    const existingPayments =
      await this.checkoutPaymentsService.findBySalesOrderId(id);
    for (const payment of existingPayments) {
      if (
        payment.status === CheckoutPaymentStatusEnum.PENDING ||
        payment.status === CheckoutPaymentStatusEnum.AWAITING_PAYMENT
      ) {
        await this.checkoutPaymentsService.cancelPayment(payment.id);
      }
    }

    const newPaymentMethod = input.payment_method_code;

    if (newPaymentMethod === 'cod') {
      // Switch to COD: update the order directly — no gateway needed
      await this.dataSource.getRepository(SalesOrderEntity).update(id, {
        payment_method: 'cod',
        payment_status: PaymentStatusEnum.COD,
        status: OrderStatusEnum.PENDING,
      });
      return { checkout_url: null, payment_transaction_number: null };
    }

    // Non-COD: find all orders linked to the same original payment (multi-seller checkout)
    // so we can charge the correct combined total
    const linkedOrderIds =
      await this.checkoutPaymentsService.getLinkedOrderIds(id);
    const allOrderIds = linkedOrderIds.length > 0 ? linkedOrderIds : [id];

    const allOrders = await this.dataSource
      .getRepository(SalesOrderEntity)
      .findBy(allOrderIds.map((oid) => ({ id: oid })));

    const retryablePaymentStatuses = [
      PaymentStatusEnum.AWAITING_PAYMENT,
      PaymentStatusEnum.FAILED,
    ];
    const retryableOrders = allOrders.filter((siblingOrder) =>
      retryablePaymentStatuses.includes(
        siblingOrder.payment_status as PaymentStatusEnum,
      ),
    );

    if (retryableOrders.length === 0) {
      throw new BadRequestException(
        'No retryable orders found for this payment group',
      );
    }

    const retryableOrderIds = retryableOrders.map(
      (siblingOrder) => siblingOrder.id,
    );
    const grandTotal = retryableOrders.reduce(
      (sum, siblingOrder) => sum + Number(siblingOrder.total_amount),
      0,
    );

    const payment = await this.checkoutPaymentsService.initiatePayment(
      {
        sales_order_id: id,
        payment_method_code: newPaymentMethod,
        amount: grandTotal,
        currency_code: 'PHP',
        description: `Payment for order ${order.order_number}`,
        ip_address: input.ip_address,
      },
      user,
    );

    // Re-link all seller orders to the new payment
    const paymentOrderRows = retryableOrderIds.map((oid, index) => ({
      checkout_payment_id: payment.id,
      sales_order_id: oid,
      is_primary: index === 0,
    }));
    await this.dataSource
      .getRepository(CheckoutPaymentOrderEntity)
      .insert(paymentOrderRows);

    // Update only orders that are still in a retryable payment state.
    // Sibling orders from the same multi-seller cart may already be confirmed
    // or completed if a partial postback was received — don't reset those.
    for (const oid of retryableOrderIds) {
      const siblingOrder = await this.dataSource
        .getRepository(SalesOrderEntity)
        .findOne({
          where: { id: oid },
          select: ['id', 'payment_status'],
        });
      if (
        siblingOrder &&
        retryablePaymentStatuses.includes(
          siblingOrder.payment_status as PaymentStatusEnum,
        )
      ) {
        await this.dataSource.getRepository(SalesOrderEntity).update(oid, {
          payment_method: newPaymentMethod,
          payment_status: PaymentStatusEnum.AWAITING_PAYMENT,
          status: OrderStatusEnum.PENDING,
        });
      }
    }

    return {
      checkout_url: payment.gateway_checkout_url ?? null,
      payment_transaction_number: payment.transaction_number ?? null,
    };
  }

  /**
   * Get tracking events for an order (current user only)
   * @param id Order ID
   * @param user Current user (for authorization)
   * @returns Order tracking events
   */
  async getOrderTracking(id: number, user: User) {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only owner or system admin can view tracking
    if (!user.system_admin && order.user_id !== user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return this.orderTrackingService.getEventsByOrderId(id);
  }

  /**
   * Find orders by user ID with pagination
   * @param userId User ID
   * @param query Query parameters
   * @returns Paginated sales orders
   */
  async findByUserId(
    userId: number,
    query: QuerySalesOrderDto,
  ): Promise<PaginatedSalesOrders> {
    const result = await this.repository.findByUserId(userId, query);

    const orderIds = result.data.map((order) => order.id);
    const voucherRecords =
      orderIds.length > 0
        ? await this.salesOrderVoucherRepository.find({
            where: { sales_order_id: In(orderIds) },
          })
        : [];
    const voucherMap = new Map(
      voucherRecords.map((v) => [v.sales_order_id, v]),
    );

    result.data = await Promise.all(
      result.data.map(async (order) => {
        const invoice = await this.invoiceRepository.findByOrderId(order.id);
        const transformedOrder = await this.transformOrderImageUrls(order);
        transformedOrder.invoice_id = invoice ? invoice.id : null;
        const voucherRecord = voucherMap.get(order.id);
        transformedOrder.voucher = voucherRecord
          ? {
              id: voucherRecord.id,
              sales_order_id: voucherRecord.sales_order_id,
              user_voucher_id: voucherRecord.user_voucher_id,
              voucher_code: voucherRecord.voucher_code,
              voucher_discount: Number(voucherRecord.voucher_discount),
              created_at: voucherRecord.created_at,
            }
          : null;
        return transformedOrder;
      }),
    );

    return result;
  }

  /**
   * Transform image paths to URLs for an order and its items
   */
  private async transformOrderImageUrls(
    order: SalesOrder,
  ): Promise<SalesOrder> {
    if (!order.items) return order;

    for (const item of order.items) {
      if (item.variant) {
        // Transform variant image URL
        if (item.variant.variant_image_url) {
          item.variant.variant_image_url = await this.getImageUrlFromPath(
            item.variant.variant_image_url,
          );
        }

        // Transform product image URL
        if (item.variant.product?.product_image_url) {
          item.variant.product.product_image_url =
            await this.getImageUrlFromPath(
              item.variant.product.product_image_url,
            );
        }
      }
    }

    return order;
  }

  /**
   * Convert a file path to a signed URL
   */
  private async getImageUrlFromPath(
    filePath: string | null,
  ): Promise<string | null> {
    if (!filePath) return null;

    try {
      const urlResult = await this.storageService.get(filePath);
      if (typeof urlResult === 'object' && 'url' in urlResult) {
        return urlResult.url;
      }
      return null;
    } catch (error) {
      console.error('Failed to generate image URL:', error);
      return null;
    }
  }

  /**
   * Find all orders with pagination (admin only)
   * @param query Query parameters
   * @param user Current user
   * @returns Paginated sales orders
   */
  async findAll(
    query: QuerySalesOrderDto,
    user: User,
  ): Promise<PaginatedSalesOrders> {
    if (!user.system_admin) {
      throw new ForbiddenException('Only admins can view all orders');
    }

    return this.repository.findAll(query);
  }

  /**
   * Cancel an order
   * @param id Order ID
   * @param input Cancel DTO with optional reason
   * @param user Current user
   * @returns Updated order
   *
   * Cancellable statuses: pending, confirmed, processing, ready_to_ship
   * For shipped/delivered/completed orders, use the return flow instead.
   *
   * TODO: Implement return/refund flow for delivered/completed orders
   */
  async cancelOrder(
    id: number,
    input: CancelOrderDto,
    user: User,
  ): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only owner or admin can cancel
    if (order.user_id !== user.id && !user.system_admin) {
      throw new ForbiddenException('You cannot cancel this order');
    }

    // Orders can be cancelled before shipping or pickup
    const cancellableStatuses = [
      OrderStatusEnum.PENDING,
      OrderStatusEnum.CONFIRMED,
      OrderStatusEnum.PROCESSING,
      OrderStatusEnum.READY_FOR_PICKUP,
      OrderStatusEnum.READY_TO_SHIP,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Order cannot be cancelled at this stage. Please request a return instead.',
      );
    }

    if (order.seller_id) {
      await this.ensureSellerWallet(order.seller_id);
    }

    // Release reserved stock (only for product items)
    if (order.items) {
      for (const item of order.items) {
        // Only release stock for product items
        if (
          item.item_type === CartItemTypeEnum.PRODUCT &&
          item.variant_id !== null &&
          item.variant_id !== undefined
        ) {
          await this.inventoryStocksService.releaseStock(
            item.variant_id,
            item.quantity,
            user,
          );
        }
      }
    }

    // Determine who is cancelling
    const cancelledBy = user.system_admin ? 'admin' : 'customer';
    const trackingMessage = input.reason
      ? `Order cancelled by ${cancelledBy}. Reason: ${input.reason}`
      : `Order cancelled by ${cancelledBy}`;

    // Update order status with cancellation metadata
    await this.dataSource.manager.update(SalesOrderEntity, id, {
      status: OrderStatusEnum.CANCELLED,
      cancellation_reason: input.reason || null,
      cancelled_at: new Date(),
      updated_by: { id: user.id } as any,
    });

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.CANCELLED,
      trackingMessage,
      user,
    );

    const cancelledOrder = (await this.repository.findById(id)) as SalesOrder;

    // Send cancellation notification
    const cancelledByType = user.system_admin ? 'seller' : 'customer';
    await this.orderNotificationService.sendOrderCancelledNotification(
      cancelledOrder,
      cancelledByType,
    );

    return cancelledOrder;
  }

  /**
   * Confirm an order (seller/admin only)
   * Transition: pending → confirmed
   * @param id Order ID
   * @param user Current user (must be seller or admin)
   * @returns Updated order
   */
  async confirmOrder(id: number, user: User): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only seller or admin can confirm
    if (!user.seller_id && !user.system_admin) {
      throw new ForbiddenException('Only sellers or admins can confirm orders');
    }

    // Only pending orders can be confirmed
    if (order.status !== OrderStatusEnum.PENDING) {
      throw new BadRequestException(
        `Order cannot be confirmed. Current status: ${order.status}`,
      );
    }

    // Validate payment before confirming (security check)
    const isCod = order.payment_method === 'cod';
    if (!isCod) {
      const payments =
        await this.checkoutPaymentsService.findPaymentsBySalesOrderId(order.id);
      const completedPayment = payments.find(
        (p) =>
          p.status === CheckoutPaymentStatusEnum.COMPLETED ||
          p.status === CheckoutPaymentStatusEnum.PARTIALLY_REFUNDED,
      );

      if (!completedPayment) {
        throw new BadRequestException(
          'Cannot confirm order. Payment has not been completed. Order payment status: ' +
            order.payment_status,
        );
      }
    }

    if (order.seller_id) {
      await this.ensureSellerWallet(order.seller_id);
    }

    const updatedOrder = await this.repository.update(id, {
      status: OrderStatusEnum.CONFIRMED,
      updated_by: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.ORDER_CONFIRMED,
      'Order has been confirmed',
      user,
    );

    // Send confirmation notification to customer
    await this.orderNotificationService.sendOrderConfirmedNotification(
      updatedOrder,
    );

    // COD: credit pending earning when seller confirms — cash will be collected on delivery.
    // For online payments, pending earning is already credited in createOrdersFromPaymentMetadata().
    if (isCod && order.seller_id) {
      try {
        await this.walletsService.creditPendingEarning(
          order.seller_id,
          order.id,
          order.subtotal,
          Number(order.commission_rate ?? 0),
        );
      } catch (e) {
        // Non-fatal: log but don't fail the confirmation
        this.logger.warn(
          `Failed to credit pending earning for COD order ${order.id}: ${(e as Error).message}`,
        );
      }
    }

    return updatedOrder;
  }

  /**
   * Start processing an order (seller/admin only)
   * Transition: confirmed → processing
   * @param id Order ID
   * @param user Current user (must be seller or admin)
   * @returns Updated order
   */
  async startProcessing(id: number, user: User): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only seller or admin can start processing
    if (!user.seller_id && !user.system_admin) {
      throw new ForbiddenException(
        'Only sellers or admins can start processing orders',
      );
    }

    // Only confirmed orders can be processed
    if (order.status !== OrderStatusEnum.CONFIRMED) {
      throw new BadRequestException(
        `Order cannot be processed. Current status: ${order.status}`,
      );
    }

    if (order.seller_id) {
      await this.ensureSellerWallet(order.seller_id);
    }

    const updatedOrder = await this.repository.update(id, {
      status: OrderStatusEnum.PROCESSING,
      updated_by: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.PROCESSING,
      'Order is being processed',
      user,
    );

    // Send processing notification to customer
    await this.orderNotificationService.sendOrderProcessingNotification(
      updatedOrder,
    );

    return updatedOrder;
  }

  /**
   * Complete an order (buyer confirms receipt)
   * Transition: delivered → completed
   * @param id Order ID
   * @param user Current user (must be order owner)
   * @returns Updated order
   */
  async completeOrder(id: number, user: User): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only order owner can complete
    if (order.user_id !== user.id) {
      throw new ForbiddenException('You can only complete your own orders');
    }

    // Only delivered orders can be completed
    if (order.status !== OrderStatusEnum.DELIVERED) {
      throw new BadRequestException(
        `Order cannot be completed. Current status: ${order.status}. Order must be in DELIVERED status.`,
      );
    }

    if (order.seller_id) {
      await this.ensureSellerWallet(order.seller_id);
    }

    // Update status and completed_at timestamp
    await this.dataSource.manager.update(SalesOrderEntity, id, {
      status: OrderStatusEnum.COMPLETED,
      completed_at: new Date(),
      updated_by: { id: user.id } as any,
    });

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.COMPLETED,
      'Order completed - customer confirmed receipt',
      user,
    );

    const completedOrder = (await this.repository.findById(id)) as SalesOrder;

    // Send completion notification
    await this.orderNotificationService.sendOrderCompletedNotification(
      completedOrder,
    );

    // Credit seller wallet — move earnings from pending to available
    if (completedOrder.seller_id) {
      await this.walletsService.confirmEarning(
        completedOrder.seller_id,
        completedOrder.id,
      );
    }

    return completedOrder;
  }

  /**
   * Request return for a delivered/completed order (customer only)
   * Transition: delivered/completed → returned
   * @param id Order ID
   * @param reason Return reason
   * @param user Current user (must be order owner)
   * @returns Updated order
   */
  async returnOrder(
    id: number,
    reason: string,
    user: User,
  ): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only order owner can request return
    if (order.user_id !== user.id) {
      throw new ForbiddenException('You can only return your own orders');
    }

    // Only delivered or completed orders can be returned
    if (
      ![OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED].includes(
        order.status,
      )
    ) {
      throw new BadRequestException(
        `Order cannot be returned. Current status: ${order.status}. Order must be in DELIVERED or COMPLETED status.`,
      );
    }

    if (order.seller_id) {
      await this.ensureSellerWallet(order.seller_id);
    }

    // Update status
    await this.dataSource.manager.update(SalesOrderEntity, id, {
      status: OrderStatusEnum.RETURNED,
      updated_by: { id: user.id } as any,
    });

    // Create tracking event
    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.RETURNED,
      `Return requested by customer. Reason: ${reason}`,
      user,
    );

    return this.repository.findById(id) as Promise<SalesOrder>;
  }

  /**
   * Ensure a seller wallet exists. Called on every order status transition so
   * wallets are created lazily for sellers who registered before wallet feature.
   */
  private async ensureSellerWallet(sellerId: number): Promise<void> {
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId },
      select: ['user_id'],
    });
    if (seller?.user_id) {
      await this.walletsService.ensureSellerWallet(seller.user_id, sellerId);
    }
  }

  /**
   * Generate unique order number
   * Format: ORD-{timestamp base36}-{random}
   * Example: ORD-M5K8P2Q3-A7B9
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Validate cart items before checkout
   * Checks: variant exists, variant active, product published, stock available
   * Only validates product items - service items are validated separately
   */
  private async validateCartItems(items: ShoppingCartItem[]): Promise<void> {
    for (const item of items) {
      // This method only validates product items
      if (item.item_type !== CartItemTypeEnum.PRODUCT) {
        throw new BadRequestException(
          'validateCartItems should only be called with product items',
        );
      }

      if (!item.variant_id) {
        throw new BadRequestException('Product items must have a variant_id');
      }

      // Get variant with product
      const variant = await this.variantRepository.findOne({
        where: { id: item.variant_id },
        relations: ['product'],
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${item.variant_id} not found`);
      }

      if (variant.status !== 'Active') {
        throw new UnprocessableEntityException(
          `${variant.variant_name} is no longer available`,
        );
      }

      if (variant.product?.status !== 'Published') {
        throw new UnprocessableEntityException(
          `${variant.product?.product_name || 'Product'} is no longer available`,
        );
      }

      // Check stock availability
      const hasStock = await this.inventoryStocksService.checkAvailability(
        item.variant_id,
        item.quantity,
      );

      if (!hasStock) {
        throw new UnprocessableEntityException(
          `Insufficient stock for ${variant.variant_name}`,
        );
      }
    }
  }

  /**
   * Validate service items before checkout
   * Checks: service exists, service is active
   */
  private async validateServiceItems(items: ShoppingCartItem[]): Promise<void> {
    for (const item of items) {
      // This method only validates service items
      if (item.item_type !== CartItemTypeEnum.SERVICE) {
        throw new BadRequestException(
          'validateServiceItems should only be called with service items',
        );
      }

      if (!item.service_id) {
        throw new BadRequestException('Service items must have a service_id');
      }

      // Get service
      const service = await this.serviceRepository.findById(item.service_id);

      if (!service) {
        throw new NotFoundException(`Service ${item.service_id} not found`);
      }

      // Check service is active
      if (service.status !== ServiceStatusEnum.ACTIVE) {
        throw new UnprocessableEntityException(
          `${service.title} is no longer available`,
        );
      }
    }
  }

  /**
   * Build legacy shipping_address text field for backward compatibility
   * Format: "recipient_name, address_line1, address_line2, city, state_province, postal_code, country"
   */
  private buildLegacyShippingAddress(address: UserAddress): string {
    const parts = [
      address.recipient_name,
      address.address_line1,
      address.address_line2,
      address.city,
      address.state_province,
      address.postal_code,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Get image URL from ProductMediaEntity
   * Priority: compressed_path > preview_path > thumbnail_path > file_path
   */
  private async getImageUrl(
    media?: MediaEntity | null,
  ): Promise<string | undefined> {
    if (!media) return undefined;
    const filePath =
      media.compressed_path ||
      media.preview_path ||
      media.thumbnail_path ||
      media.file_path;
    if (!filePath) return undefined;

    try {
      const urlResult = await this.storageService.get(filePath);
      if (typeof urlResult === 'object' && 'url' in urlResult) {
        return urlResult.url;
      }
      return undefined;
    } catch (error) {
      console.error('Failed to generate image URL:', error);
      return undefined;
    }
  }

  /**
   * Get product image URL from product media mappings
   * Priority: primary image > first by display_order
   */
  private async getProductImageUrl(
    mappings?: ProductMediaMappingEntity[] | null,
  ): Promise<string | undefined> {
    if (!mappings || mappings.length === 0) return undefined;

    // Find primary image first
    const primaryMapping = mappings.find((m) => m.is_primary && m.media);
    if (primaryMapping) {
      return this.getImageUrl(primaryMapping.media);
    }

    // Fall back to first by display_order
    const sortedMappings = [...mappings]
      .filter((m) => m.media)
      .sort((a, b) => a.display_order - b.display_order);

    if (sortedMappings.length > 0) {
      return this.getImageUrl(sortedMappings[0].media);
    }

    return undefined;
  }

  /**
   * Group cart items by seller ID
   * Returns a Map where key is seller_id and value is array of cart items
   * Items with unknown seller are grouped under null
   */
  private async groupItemsBySeller(
    items: ShoppingCartItem[],
  ): Promise<Map<number | null, ShoppingCartItem[]>> {
    const sellerMap = new Map<number | null, ShoppingCartItem[]>();

    for (const item of items) {
      let sellerId: number | null = null;

      if (item.item_type === CartItemTypeEnum.PRODUCT && item.variant_id) {
        // Get seller from product variant
        const variant = await this.variantRepository.findOne({
          where: { id: item.variant_id },
          relations: ['product'],
        });
        if (variant?.product?.seller_id) {
          sellerId = variant.product.seller_id;
        }
      } else if (
        item.item_type === CartItemTypeEnum.SERVICE &&
        item.service_id
      ) {
        // Get seller from service
        const service = await this.serviceRepository.findById(item.service_id);
        if (service?.seller_id) {
          sellerId = service.seller_id;
        }
      }

      // Group by seller_id
      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, []);
      }
      sellerMap.get(sellerId)!.push(item);
    }

    return sellerMap;
  }

  /**
   * Calculate totals for a subset of cart items
   */
  private calculateItemsTotals(items: ShoppingCartItem[]): {
    subtotal: number;
    itemCount: number;
    lineCount: number;
  } {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0,
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const lineCount = items.length;
    return { subtotal, itemCount, lineCount };
  }

  /**
   * Validates and applies vouchers to the order using shared voucher validation logic.
   * Checks voucher ownership via user_vouchers and calculates discounts.
   * Returns early with error if any voucher is invalid.
   */
  private async validateAndApplyVouchers(input: {
    voucherIds: number[];
    user: User;
    sellerProductItems: ShoppingCartItem[];
    sellerServiceItems: ShoppingCartItem[];
    originalSubtotal: number;
    originalShippingAmount: number;
  }): Promise<VoucherValidationResult> {
    const {
      voucherIds,
      user,
      sellerProductItems,
      sellerServiceItems,
      originalShippingAmount,
    } = input;
    const variants: Array<{ variant_id: number; quantity: number }> =
      sellerProductItems
        .filter(
          (item) => item.variant_id !== null && item.variant_id !== undefined,
        )
        .map((item) => ({
          variant_id: item.variant_id as number,
          quantity: item.quantity,
        }));
    const serviceIds: number[] = sellerServiceItems
      .filter(
        (item) => item.service_id !== null && item.service_id !== undefined,
      )
      .map((item) => item.service_id as number);
    const validateVoucherInput: ValidateVoucherDto = {
      vouchers: voucherIds,
      shipping_fee: originalShippingAmount,
      variants: variants.length > 0 ? variants : undefined,
      service_ids: serviceIds.length > 0 ? serviceIds : undefined,
    };
    const validationResult: VoucherValidationResult =
      await this.vouchersService.validateVoucher(validateVoucherInput, user);
    const hasInvalidVoucher = validationResult.applied_vouchers?.some(
      (v) => v.is_valid === false,
    );
    if (hasInvalidVoucher) {
      throw new BadRequestException(
        'One or more vouchers are invalid or not owned by the user',
      );
    }
    const appliedVoucherIds: number[] = (
      validationResult.applied_vouchers ?? []
    ).map((voucher) => voucher.voucher_id);
    const unappliedVoucherIds: number[] = voucherIds.filter(
      (voucherId: number) => !appliedVoucherIds.includes(voucherId),
    );
    if (unappliedVoucherIds.length > 0) {
      throw new BadRequestException(
        `Requested vouchers could not be applied: ${unappliedVoucherIds.join(', ')}`,
      );
    }
    return validationResult;
  }

  /**
   * Validates vouchers for checkout preview using shared voucher validation logic.
   * Builds checkout context from cart items and calls VouchersService.validateVoucher.
   * @param user Current authenticated user
   * @param selectedItems Selected cart items (products and services)
   * @param subtotal Order subtotal
   * @param shippingAmount Shipping amount
   * @param voucherIds Array of voucher IDs to validate
   * @returns Voucher validation result with applied vouchers and discount breakdown
   */
  private async validateVouchersForCheckoutPreview(
    user: User,
    selectedItems: ShoppingCartItem[],
    subtotal: number,
    shippingAmount: number,
    voucherIds: number[],
  ): Promise<VoucherValidationResult> {
    const productItems = selectedItems.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.PRODUCT &&
        item.variant_id !== null &&
        item.variant_id !== undefined,
    );
    const serviceItems = selectedItems.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.SERVICE &&
        item.service_id !== null &&
        item.service_id !== undefined,
    );
    const variants: Array<{ variant_id: number; quantity: number }> =
      productItems.map((item) => ({
        variant_id: item.variant_id as number,
        quantity: item.quantity,
      }));
    const serviceIds: number[] = serviceItems.map(
      (item) => item.service_id as number,
    );
    const validateVoucherInput: ValidateVoucherDto = {
      vouchers: voucherIds,
      shipping_fee: shippingAmount,
      variants: variants.length > 0 ? variants : undefined,
      service_ids: serviceIds.length > 0 ? serviceIds : undefined,
    };
    return this.vouchersService.validateVoucher(validateVoucherInput, user);
  }

  /**
   * Get checkout preview with items payload
   *
   * Allows passing items directly instead of using cart
   */
  async getCheckoutPreviewWithItems(
    user: User,
    items: CheckoutItemDto[],
    addressId?: number,
    shippingMethodId?: number,
    voucherIds?: number[],
    voucherCode?: string,
  ): Promise<CheckoutPreview> {
    // Convert DTO items to cart item format
    const selectedItems = items.map((item) => ({
      id: item.id,
      is_selected: item.is_selected ?? true,
      item_type:
        item.item_type === 'product'
          ? CartItemTypeEnum.PRODUCT
          : CartItemTypeEnum.SERVICE,
      variant_id: item.variant_id,
      service_id: item.service_id,
      package_id: item.package_id,
      quantity: item.quantity,
      total_price: item.total_price,
      unit_price: item.unit_price,
    })) as ShoppingCartItem[];

    // Handle no selected items
    if (selectedItems.length === 0) {
      return {
        can_checkout: false,
        items: [],
        summary: {
          line_count: 0,
          item_count: 0,
          subtotal: 0,
          tax_amount: 0,
          shipping_amount: 0,
          total_amount: 0,
        },
        errors: [
          'No items provided for checkout. Please provide products or services to proceed.',
        ],
      };
    }

    // Validate each item and build preview
    const previewItems: CheckoutPreviewItem[] = [];
    const errors: string[] = [];
    let subtotal = 0;

    for (const item of selectedItems) {
      const previewItem = await this.buildPreviewItemFromPayload(item);
      previewItems.push(previewItem);
      subtotal += previewItem.total_price;

      if (!previewItem.is_available && previewItem.unavailable_reason) {
        errors.push(previewItem.unavailable_reason);
      }
    }

    const canCheckout = errors.length === 0;

    // Calculate shipping if items are valid (only for product items)
    let shippingAmount = 0;
    let shipping: ShippingRateResponseDto | undefined;
    const productItems = selectedItems.filter(
      (item) => item.item_type === CartItemTypeEnum.PRODUCT,
    );
    if (canCheckout && productItems.length > 0) {
      try {
        shipping = await this.calculateShippingDetailsForCheckout(
          user,
          productItems,
          subtotal,
          addressId,
          shippingMethodId,
        );

        shippingAmount = shipping?.shipping_amount ?? 0;
      } catch (error) {
        // Re-throw NotFoundException for address or shipping method issues
        if (error instanceof NotFoundException) {
          throw error;
        }
        // If shipping calculation fails, add warning but don't block checkout
        if (error instanceof Error) {
          errors.push(`Shipping calculation: ${error.message}`);
        }
      }
    }

    // Handle voucher validation
    let appliedVoucher: Voucher | null = null;
    if (voucherCode && canCheckout) {
      try {
        const userVoucher = await this.vouchersService.collectVoucherByCode(
          { voucher_code: voucherCode },
          user,
        );
        appliedVoucher = userVoucher.voucher ?? null;
      } catch (error) {
        errors.push(
          `Voucher "${voucherCode}" is invalid or cannot be used: ${error.message}`,
        );
      }
    } else if (voucherIds && voucherIds.length > 0 && canCheckout) {
      try {
        const serviceItems = selectedItems.filter(
          (item) =>
            item.item_type === CartItemTypeEnum.SERVICE &&
            item.service_id !== null &&
            item.service_id !== undefined,
        );
        const variants: Array<{ variant_id: number; quantity: number }> =
          productItems.map((item) => ({
            variant_id: item.variant_id as number,
            quantity: item.quantity,
          }));
        const serviceIds: number[] = serviceItems.map(
          (item) => item.service_id as number,
        );
        const validateVoucherInput: ValidateVoucherDto = {
          vouchers: voucherIds,
          shipping_fee: shippingAmount,
          variants: variants.length > 0 ? variants : undefined,
          service_ids: serviceIds.length > 0 ? serviceIds : undefined,
        };
        const validationResult = await this.vouchersService.validateVoucher(
          validateVoucherInput,
          user,
        );
        if (validationResult.is_valid && validationResult.voucher) {
          appliedVoucher = validationResult.voucher;
        }
      } catch (error) {
        errors.push(`Voucher validation failed: ${error.message}`);
      }
    }

    // Apply voucher discount
    let discountedSubtotal = subtotal;
    if (appliedVoucher && canCheckout) {
      const discountResult = await this.calculateVoucherDiscountForPreview(
        user,
        appliedVoucher,
        subtotal,
        shippingAmount,
        selectedItems,
      );
      discountedSubtotal = discountResult.subtotal;
    }

    const totalAmount = discountedSubtotal + shippingAmount;

    return {
      can_checkout: canCheckout,
      items: previewItems,
      summary: {
        line_count: previewItems.length,
        item_count: previewItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal,
        tax_amount: 0, // TODO: Calculate tax
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
      },
      applied_voucher: appliedVoucher
        ? {
            id: appliedVoucher.id,
            code: appliedVoucher.code,
            scope: appliedVoucher.scope,
            seller_id: appliedVoucher.seller_id,
            discount_type: appliedVoucher.discount_type,
            discount_value: appliedVoucher.discount_value,
            max_discount_cap: appliedVoucher.max_discount_cap,
            min_order_amount: appliedVoucher.min_order_amount,
            total_limit: appliedVoucher.total_limit,
            per_user_limit: appliedVoucher.per_user_limit,
            used_count: appliedVoucher.used_count,
            starts_at: appliedVoucher.starts_at,
            expires_at: appliedVoucher.expires_at,
            status: appliedVoucher.status,
            is_claimable: appliedVoucher.is_claimable,
            description: appliedVoucher.description,
            terms_and_conditions: appliedVoucher.terms_and_conditions,
            created_at: appliedVoucher.created_at,
            updated_at: appliedVoucher.updated_at,
            deleted_at: appliedVoucher.deleted_at,
            voucher_categories: [],
            voucher_products: [],
          }
        : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Calculate voucher discount for checkout preview using validateVoucher.
   */
  private async calculateVoucherDiscountForPreview(
    user: User,
    voucher: Voucher,
    subtotal: number,
    shippingAmount: number,
    selectedItems: ShoppingCartItem[],
  ): Promise<{ subtotal: number; discount: number }> {
    const productItems = selectedItems.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.PRODUCT && item.variant_id != null,
    );
    const serviceItems = selectedItems.filter(
      (item) =>
        item.item_type === CartItemTypeEnum.SERVICE && item.service_id != null,
    );
    const variants: Array<{ variant_id: number; quantity: number }> =
      productItems.map((item) => ({
        variant_id: item.variant_id as number,
        quantity: item.quantity,
      }));
    const serviceIds: number[] = serviceItems.map(
      (item) => item.service_id as number,
    );
    const validateVoucherInput: ValidateVoucherDto = {
      vouchers: [voucher.id],
      shipping_fee: shippingAmount,
      variants: variants.length > 0 ? variants : undefined,
      service_ids: serviceIds.length > 0 ? serviceIds : undefined,
    };
    const result = await this.vouchersService.validateVoucher(
      validateVoucherInput,
      user,
    );
    const itemDiscount = result.item_discount_amount ?? 0;
    const shippingDiscount = result.shipping_fee_discount ?? 0;
    return {
      subtotal: subtotal - itemDiscount,
      discount: itemDiscount + shippingDiscount,
    };
  }

  /**
   * Build preview item from payload data
   */
  private async buildPreviewItemFromPayload(
    item: any,
  ): Promise<CheckoutPreviewItem> {
    if (item.item_type === CartItemTypeEnum.PRODUCT) {
      // Validate product variant
      const variant = await this.variantRepository.findOne({
        where: { id: item.variant_id, status: 'Active' },
        relations: ['product', 'inventory_stock'],
      });

      if (!variant) {
        return {
          id: item.id,
          item_type: 'product',
          variant_id: item.variant_id,
          variant_name: 'Unknown Product',
          product_name: 'Unknown Product',
          sku: 'UNKNOWN',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          is_available: false,
          unavailable_reason: 'Product variant not found or inactive',
        };
      }

      // Check stock availability
      const availableStock = variant.inventory_stock?.available_quantity ?? 0;
      const isAvailable = availableStock >= item.quantity;

      return {
        id: item.id,
        item_type: 'product',
        variant_id: item.variant_id,
        variant_name: variant.variant_name,
        product_name: variant.product?.product_name || 'Unknown Product',
        sku: variant.sku,
        quantity: item.quantity,
        unit_price: Number(variant.selling_price),
        total_price: item.total_price,
        is_available: isAvailable,
        unavailable_reason: isAvailable
          ? undefined
          : 'Insufficient stock available',
      };
    } else {
      // Validate service
      const service = await this.serviceRepository.findById(item.service_id);

      if (!service || service.status !== ServiceStatusEnum.ACTIVE) {
        return {
          id: item.id,
          item_type: 'service',
          service_id: item.service_id,
          service_name: 'Unknown Service',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          is_available: false,
          unavailable_reason: 'Service not found or inactive',
        };
      }

      return {
        id: item.id,
        item_type: 'service',
        service_id: item.service_id,
        service_name: service.title,
        quantity: item.quantity,
        unit_price: Number(service.base_price),
        total_price: item.total_price,
        is_available: true,
      };
    }
  }

  /**
   * Update pickup order status (seller/admin only)
   * Automatically advances: processing → ready_for_pickup → completed
   */
  async updatePickupStatus(
    id: number,
    statusNotes: string | undefined,
    user: User,
  ): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (!user.seller_id && !user.system_admin) {
      throw new ForbiddenException(
        'Only sellers or admins can update pickup status',
      );
    }

    if (order.fulfillment_type !== 'pickup') {
      throw new BadRequestException('Order is not a pickup order');
    }

    const allowedTransitions: Partial<
      Record<OrderStatusEnum, OrderStatusEnum>
    > = {
      [OrderStatusEnum.PROCESSING]: OrderStatusEnum.READY_FOR_PICKUP,
      [OrderStatusEnum.READY_FOR_PICKUP]: OrderStatusEnum.COMPLETED,
    };

    const nextStatus = allowedTransitions[order.status];
    if (!nextStatus) {
      throw new BadRequestException(
        `Pickup order in status "${order.status}" cannot be advanced`,
      );
    }

    const updatePayload: Partial<SalesOrderEntity> = {
      status: nextStatus,
      status_notes: statusNotes ?? null,
      updated_by: { id: user.id } as any,
    };

    if (nextStatus === OrderStatusEnum.READY_FOR_PICKUP) {
      updatePayload.ready_for_pickup_at = new Date();
      // Generate a 4-digit numeric confirmation code the customer presents on pickup
      updatePayload.pickup_confirmation_code = String(
        Math.floor(Math.random() * 10000),
      ).padStart(4, '0');
    } else if (nextStatus === OrderStatusEnum.COMPLETED) {
      updatePayload.picked_up_at = new Date();
      updatePayload.completed_at = new Date();
    }

    await this.dataSource.manager.update(SalesOrderEntity, id, updatePayload);

    const eventType =
      nextStatus === OrderStatusEnum.READY_FOR_PICKUP
        ? OrderEventTypeEnum.READY_FOR_PICKUP
        : OrderEventTypeEnum.COMPLETED;

    const eventMessage =
      nextStatus === OrderStatusEnum.READY_FOR_PICKUP
        ? 'Order is ready for pickup'
        : 'Order has been picked up';

    await this.orderTrackingService.createEvent(
      id,
      eventType,
      eventMessage,
      user,
    );

    // Move pending earnings to available when pickup order is completed
    if (nextStatus === OrderStatusEnum.COMPLETED && order.seller_id) {
      try {
        await this.walletsService.confirmEarning(order.seller_id, order.id);
      } catch (e) {
        this.logger.warn(
          `Failed to confirm earning for seller ${order.seller_id}, order ${order.id}: ${(e as Error).message}`,
        );
      }
    }

    return (await this.repository.findById(id)) as SalesOrder;
  }

  /**
   * Mark a pickup order as no-show (seller/admin only)
   * Transition: ready_for_pickup → cancelled (no-show)
   */
  async markPickupNoShow(id: number, user: User): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (!user.seller_id && !user.system_admin) {
      throw new ForbiddenException(
        'Only sellers or admins can mark orders as no-show',
      );
    }

    if (order.fulfillment_type !== 'pickup') {
      throw new BadRequestException('Order is not a pickup order');
    }

    if (order.status !== OrderStatusEnum.READY_FOR_PICKUP) {
      throw new BadRequestException(
        `Order must be in READY_FOR_PICKUP status to mark as no-show. Current status: ${order.status}`,
      );
    }

    // Release reserved stock for product items (same as cancelOrder)
    if (order.items) {
      for (const item of order.items) {
        if (
          item.item_type === CartItemTypeEnum.PRODUCT &&
          item.variant_id !== null &&
          item.variant_id !== undefined
        ) {
          await this.inventoryStocksService.releaseStock(
            item.variant_id,
            item.quantity,
            user,
          );
        }
      }
    }

    await this.dataSource.manager.update(SalesOrderEntity, id, {
      status: OrderStatusEnum.CANCELLED,
      cancellation_reason: 'Customer no-show',
      cancelled_at: new Date(),
      updated_by: { id: user.id } as any,
    });

    await this.orderTrackingService.createEvent(
      id,
      OrderEventTypeEnum.PICKUP_NO_SHOW,
      'Order cancelled - customer no-show',
      user,
    );

    return (await this.repository.findById(id)) as SalesOrder;
  }

  /**
   * Extend the grace period for a pickup order (seller/admin only)
   */
  async extendPickupGracePeriod(
    id: number,
    extensionMinutes: number,
    user: User,
  ): Promise<SalesOrder> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (!user.seller_id && !user.system_admin) {
      throw new ForbiddenException(
        'Only sellers or admins can extend the grace period',
      );
    }

    if (order.fulfillment_type !== 'pickup') {
      throw new BadRequestException('Order is not a pickup order');
    }

    if (order.status !== OrderStatusEnum.READY_FOR_PICKUP) {
      throw new BadRequestException(
        `Grace period can only be extended for orders in READY_FOR_PICKUP status. Current status: ${order.status}`,
      );
    }

    const newTotal = (order.grace_period_extension ?? 0) + extensionMinutes;

    if (newTotal > 480) {
      throw new BadRequestException(
        'Grace period extension cannot exceed 480 minutes total',
      );
    }

    await this.dataSource.manager.update(SalesOrderEntity, id, {
      grace_period_extension: newTotal,
      updated_by: { id: user.id } as any,
    });

    return (await this.repository.findById(id)) as SalesOrder;
  }

  /**
   * Manual-proof methods for service-only checkout.
   *
   * Supports dynamic QR codes (custom-{id}) plus builtin/manual aliases.
   */
  private isServiceManualProofPaymentMethod(
    paymentMethodCode: string,
  ): boolean {
    const normalized = String(paymentMethodCode || '')
      .trim()
      .toLowerCase();

    if (!normalized) return false;
    if (normalized.startsWith('custom-')) return true;

    return new Set([
      'gcash',
      'maya_qr',
      'unionbank_qr',
      // Legacy aliases still accepted by backend
      'maya',
      'paymaya',
      'paymaya_direct',
      'unionbank',
      'union_bank',
    ]).has(normalized);
  }
}
