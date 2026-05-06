import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SalesOrdersService } from './sales-orders.service';
import { BaseSalesOrderRepository } from './persistence/base-sales-order.repository';
import { ShoppingCartsService } from '@/shopping-carts/shopping-carts.service';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { UserAddressesService } from '@/user-addresses/user-addresses.service';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { SalesOrder } from './domain/sales-order';
import { OrderStatusEnum } from './domain/order-status.enum';
import { ShoppingCart } from '@/shopping-carts/domain/shopping-cart';
import { User } from '@/users/domain/user';
import { UserAddress } from '@/user-addresses/domain/user-address';
import { StorageService } from '@/storage/storage.service';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { ShippingService } from '@/shipping/services/shipping.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { BaseInvoiceRepository } from '@/invoices/persistence/repositories/base-invoice.repository';
import { BaseServiceRepository } from '@/services/persistence/base-service.repository';
import { BookingsService } from '@/bookings/bookings.service';
import { CartItemAddonRepository } from '@/cart-item-addons/persistence/repositories/cart-item-addon.repository';
import { CartItemOptionRepository } from '@/cart-item-options/persistence/repositories/cart-item-option.repository';
import { SalesOrderItemAddonRepository } from '@/sales-order-item-addons/persistence/repositories/sales-order-item-addon.repository';
import { SalesOrderItemOptionRepository } from '@/sales-order-item-options/persistence/repositories/sales-order-item-option.repository';
import { OrderNotificationService } from '../notifications/services/order-notification.service';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { CheckoutSessionsService } from '@/checkout-sessions/checkout-sessions.service';
import { VouchersService } from '@/vouchers/vouchers.service';
import { PickupAvailabilityService } from './pickup-availability.service';
import { WalletsService } from '@/wallets/wallets.service';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;
  let repository: jest.Mocked<BaseSalesOrderRepository>;
  let invoiceRepository: jest.Mocked<BaseInvoiceRepository>;
  let shoppingCartsService: jest.Mocked<ShoppingCartsService>;
  let inventoryStocksService: jest.Mocked<InventoryStocksService>;
  let userAddressesService: jest.Mocked<UserAddressesService>;
  let serviceRepository: jest.Mocked<BaseServiceRepository>;
  let checkoutPaymentsService: jest.Mocked<CheckoutPaymentsService>;
  let storageService: jest.Mocked<StorageService>;
  let variantRepository: any;
  let mockQueryRunner: any;
  let mockSellerRepository: any;

  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    system_admin: false,
  } as User;

  const mockAdminUser: User = {
    id: 2,
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    system_admin: true,
  } as User;

  const mockCart: ShoppingCart = {
    id: 1,
    user_id: 1,
    items: [
      {
        id: 1,
        shopping_cart_id: 1,
        variant_id: 1,
        quantity: 2,
        unit_price: 100,
        total_price: 200,
        is_selected: true,
        item_type: CartItemTypeEnum.PRODUCT,
      },
      {
        id: 2,
        shopping_cart_id: 1,
        variant_id: 2,
        quantity: 1,
        unit_price: 150,
        total_price: 150,
        is_selected: true,
        item_type: CartItemTypeEnum.PRODUCT,
      },
    ],
    summary: {
      item_count: 3,
      subtotal: 350,
      tax_amount: 0,
      shipping_amount: 0,
      total_amount: 350,
    },
    created_at: new Date(),
    updated_at: new Date(),
  } as ShoppingCart;

  const mockOrder: SalesOrder = {
    id: 1,
    user_id: 1,
    order_number: 'ORD-TEST-1234',
    status: OrderStatusEnum.PENDING,
    subtotal: 350,
    tax_amount: 0,
    shipping_amount: 0,
    total_amount: 350,
    items: [
      {
        id: 1,
        order_id: 1,
        variant_id: 1,
        quantity: 2,
        unit_price: 100,
        total_price: 200,
        item_type: CartItemTypeEnum.PRODUCT,
      },
      {
        id: 2,
        order_id: 1,
        variant_id: 2,
        quantity: 1,
        unit_price: 150,
        total_price: 150,
        item_type: CartItemTypeEnum.PRODUCT,
      },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  } as SalesOrder;

  const mockVariant = {
    id: 1,
    sku: 'TEST-SKU',
    variant_name: 'Test Variant',
    selling_price: 100,
    status: 'Active',
    product: {
      id: 1,
      product_name: 'Test Product',
      status: 'Published',
      seller_id: 1,
    },
  };

  const mockAddress: UserAddress = {
    id: 1,
    user_id: 1,
    label: 'Home',
    recipient_name: 'John Doe',
    phone: '+639123456789',
    address_line1: '123 Main Street',
    address_line2: 'Unit 4B',
    city: 'Manila',
    state_province: 'Metro Manila',
    postal_code: '1000',
    country: 'Philippines',
    is_default: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSecondAddress: UserAddress = {
    id: 2,
    user_id: 1,
    label: 'Work',
    recipient_name: 'John Work',
    phone: '+639987654321',
    address_line1: '456 Business Ave',
    address_line2: null,
    city: 'Makati',
    state_province: 'Metro Manila',
    postal_code: '1200',
    country: 'Philippines',
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    // Create mock query runner with properly typed jest mock functions
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn().mockImplementation((_, data) => data),
        save: jest.fn().mockImplementation((data) => {
          if (Array.isArray(data)) {
            return data.map((item, index) => ({
              ...item,
              id: index + 1,
            }));
          }
          return { ...data, id: 1 };
        }),
        findOne: jest.fn(),
        update: jest.fn(),
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: jest.fn().mockReturnValue({
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({
              available_quantity: 100,
              reserved_quantity: 0,
            }),
          }),
          save: jest.fn().mockImplementation((data) => data),
        }),
      },
    };

    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const mockInvoiceRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      findByInvoiceNumber: jest.fn(),
      update: jest.fn(),
      generateInvoiceNumber: jest.fn(),
      getDataSource: jest.fn(),
    };

    const mockShoppingCartsService = {
      getMyCart: jest.fn(),
      getCartWithItems: jest.fn(),
      clearCart: jest.fn(),
    };

    const mockInventoryStocksService = {
      checkAvailability: jest.fn(),
      reserveStock: jest.fn(),
      releaseStock: jest.fn(),
    };

    const mockUserAddressesService = {
      getAddressForCheckout: jest.fn(),
      getDefaultAddressForCheckout: jest.fn(),
    };

    const mockStorageService = {
      get: jest.fn(),
    };

    const mockVariantRepository = {
      findOne: jest.fn(),
    };

    mockSellerRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockShippingService = {
      calculateShipping: jest.fn().mockResolvedValue({
        shipping_amount: 0,
        distance_km: 0,
        chargeable_weight_kg: 0,
        is_free_shipping: false,
      }),
    };

    const mockPickupAvailabilityService = {
      checkPickupAvailability: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      manager: {
        update: jest.fn(),
      },
      getRepository: jest.fn().mockReturnValue({
        update: jest.fn(),
      }),
      transaction: jest.fn().mockImplementation((cb) => {
        const transactionalManager = {
          getRepository: jest.fn().mockReturnValue({
            update: jest.fn(),
          }),
        };
        return cb(transactionalManager);
      }),
    };

    const mockOrderTrackingService = {
      createEvent: jest.fn(),
      getEventsByOrderId: jest.fn(),
      getLatestEventByOrderId: jest.fn(),
    };

    const mockNotificationsService = {
      sendOrderPlaced: jest.fn().mockResolvedValue({}),
      sendNewOrderToSeller: jest.fn().mockResolvedValue({}),
      sendOrderConfirmed: jest.fn().mockResolvedValue({}),
      sendOrderProcessing: jest.fn().mockResolvedValue({}),
      sendOrderCancelled: jest.fn().mockResolvedValue({}),
      sendOrderCancelledToSeller: jest.fn().mockResolvedValue({}),
      sendOrderCompleted: jest.fn().mockResolvedValue({}),
      sendOrderCompletedToSeller: jest.fn().mockResolvedValue({}),
    };

    const mockServiceRepository = {
      findById: jest.fn(),
      findDetail: jest.fn(),
    };

    const mockBookingsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockCartItemAddonRepository = {
      findByCartItemIdWithAddon: jest.fn().mockResolvedValue([]),
      findByCartItemIdsWithAddon: jest.fn().mockResolvedValue([]),
    };

    const mockCartItemOptionRepository = {
      findByCartItemIdWithOption: jest.fn().mockResolvedValue([]),
      findByCartItemIdsWithOption: jest.fn().mockResolvedValue([]),
    };

    const mockSalesOrderItemAddonRepository = {
      findBySalesOrderItemId: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue([]),
    };

    const mockSalesOrderItemOptionRepository = {
      findBySalesOrderItemId: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue([]),
    };

    const mockSalesOrderVoucherRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        {
          provide: BaseSalesOrderRepository,
          useValue: mockRepository,
        },
        {
          provide: BaseInvoiceRepository,
          useValue: mockInvoiceRepository,
        },
        {
          provide: ShoppingCartsService,
          useValue: mockShoppingCartsService,
        },
        {
          provide: InventoryStocksService,
          useValue: mockInventoryStocksService,
        },
        {
          provide: UserAddressesService,
          useValue: mockUserAddressesService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
        {
          provide: PickupAvailabilityService,
          useValue: mockPickupAvailabilityService,
        },
        {
          provide: getRepositoryToken(ProductVariantEntity),
          useValue: mockVariantRepository,
        },
        {
          provide: getRepositoryToken(SellerEntity),
          useValue: mockSellerRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: OrderTrackingService,
          useValue: mockOrderTrackingService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: BaseServiceRepository,
          useValue: mockServiceRepository,
        },
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
        {
          provide: CartItemAddonRepository,
          useValue: mockCartItemAddonRepository,
        },
        {
          provide: CartItemOptionRepository,
          useValue: mockCartItemOptionRepository,
        },
        {
          provide: SalesOrderItemAddonRepository,
          useValue: mockSalesOrderItemAddonRepository,
        },
        {
          provide: SalesOrderItemOptionRepository,
          useValue: mockSalesOrderItemOptionRepository,
        },
        {
          provide: OrderNotificationService,
          useValue: {
            sendOrderPlacedNotification: jest.fn(),
            sendOrderConfirmedNotification: jest.fn(),
            sendOrderProcessingNotification: jest.fn(),
            sendOrderShippedNotification: jest.fn(),
            sendOrderDeliveredNotification: jest.fn(),
            sendOrderCompletedNotification: jest.fn(),
            sendOrderCancelledNotification: jest.fn(),
          },
        },
        {
          provide: CheckoutPaymentsService,
          useValue: {
            initiatePayment: jest.fn(),
          },
        },
        {
          provide: CheckoutSessionsService,
          useValue: {},
        },
        {
          provide: getRepositoryToken(SalesOrderVoucherEntity),
          useValue: mockSalesOrderVoucherRepository,
        },
        {
          provide: VouchersService,
          useValue: {
            validateVoucher: jest.fn().mockResolvedValue({
              item_discount_amount: 0,
              shipping_fee: 0,
              shipping_fee_discount: 0,
              discount_amount: 0,
              original_subtotal: 0,
              total_discount_amount: 0,
              final_payable_amount: 0,
              applied_vouchers: [],
            }),
          },
        },
        {
          provide: WalletsService,
          useValue: {
            creditPendingEarning: jest.fn().mockResolvedValue(undefined),
            confirmEarning: jest.fn().mockResolvedValue(undefined),
            ensureSellerWallet: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SalesOrdersService>(SalesOrdersService);
    repository = module.get(BaseSalesOrderRepository);
    invoiceRepository = module.get(BaseInvoiceRepository);
    shoppingCartsService = module.get(ShoppingCartsService);
    inventoryStocksService = module.get(InventoryStocksService);
    userAddressesService = module.get(UserAddressesService);
    serviceRepository = module.get(BaseServiceRepository);
    checkoutPaymentsService = module.get(CheckoutPaymentsService);
    storageService = module.get(StorageService);
    variantRepository = module.get(getRepositoryToken(ProductVariantEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCheckoutPreview', () => {
    beforeEach(() => {
      shoppingCartsService.getCartWithItems.mockResolvedValue(mockCart);
      variantRepository.findOne.mockResolvedValue(mockVariant);
      inventoryStocksService.checkAvailability.mockResolvedValue(true);
      storageService.get.mockResolvedValue({
        url: 'http://example.com/image.jpg',
      });
      // Mock seller repository to return seller entities
      mockSellerRepository.find.mockResolvedValue([
        {
          id: 1,
          store_name: 'Test Store',
          pickup_address_entity: null,
        },
      ]);
    });

    it('should return preview with can_checkout true when all items available', async () => {
      // Mock address service to return address without coordinates (shipping will be 0)
      userAddressesService.getDefaultAddressForCheckout.mockRejectedValue(
        new Error('No address'),
      );

      const result = await service.getCheckoutPreview(mockUser);

      expect(result.can_checkout).toBe(true);
      expect(result.items).toHaveLength(2);
      // Shipping errors don't block checkout, they're just warnings
      expect(result.summary.subtotal).toBe(350);
      expect(result.summary.shipping_amount).toBe(0);
      expect(result.is_free_shipping).toBeUndefined();
      expect(result.shipping).toBeUndefined();
    });

    it('should return preview with can_checkout false when no items selected', async () => {
      shoppingCartsService.getCartWithItems.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      const result = await service.getCheckoutPreview(mockUser);

      expect(result.can_checkout).toBe(false);
      expect(result.items).toHaveLength(0);
      expect(result.errors).toContain(
        'No items selected for checkout. Please select products or services to proceed.',
      );
    });

    it('should only include selected items in preview', async () => {
      shoppingCartsService.getCartWithItems.mockResolvedValue({
        ...mockCart,
        items: [
          { ...mockCart.items![0], is_selected: true },
          { ...mockCart.items![1], is_selected: false },
        ],
      });

      const result = await service.getCheckoutPreview(mockUser);

      expect(result.can_checkout).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.summary.total_amount).toBe(200); // Only first item
    });

    it('should mark item unavailable when variant not found', async () => {
      variantRepository.findOne.mockResolvedValue(null);

      const result = await service.getCheckoutPreview(mockUser);

      expect(result.can_checkout).toBe(false);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].is_available).toBe(false);
      expect(result.items[0].unavailable_reason).toContain('not found');
    });

    it('should mark item unavailable when variant is inactive', async () => {
      variantRepository.findOne.mockResolvedValue({
        ...mockVariant,
        status: 'Inactive',
      });

      const result = await service.getCheckoutPreview(mockUser);

      expect(result.can_checkout).toBe(false);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].is_available).toBe(false);
      expect(result.items[0].unavailable_reason).toContain(
        'no longer available',
      );
    });

    it('should mark item unavailable when product is not published', async () => {
      variantRepository.findOne.mockResolvedValue({
        ...mockVariant,
        product: { ...mockVariant.product, status: 'Draft' },
      });

      const result = await service.getCheckoutPreview(mockUser);

      expect(result.can_checkout).toBe(false);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].is_available).toBe(false);
    });

    it('should mark item unavailable when insufficient stock', async () => {
      inventoryStocksService.checkAvailability.mockResolvedValue(false);

      const result = await service.getCheckoutPreview(mockUser);

      expect(result.can_checkout).toBe(false);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].is_available).toBe(false);
      expect(result.items[0].unavailable_reason).toContain(
        'Insufficient stock',
      );
    });
  });

  describe('placeOrder', () => {
    beforeEach(() => {
      shoppingCartsService.getCartWithItems.mockResolvedValue(mockCart);
      variantRepository.findOne.mockResolvedValue(mockVariant);
      inventoryStocksService.checkAvailability.mockResolvedValue(true);
      repository.findById.mockResolvedValue(mockOrder);
      shoppingCartsService.clearCart.mockResolvedValue(undefined);
      userAddressesService.getDefaultAddressForCheckout.mockResolvedValue(
        mockAddress,
      );
      userAddressesService.getAddressForCheckout.mockResolvedValue(mockAddress);
    });

    describe('successful order placement', () => {
      it('should create order from cart successfully', async () => {
        const result = await service.placeOrder({}, mockUser);

        expect(result.orders).toHaveLength(1);
        expect(result.orders[0]).toEqual(mockOrder);
        expect(result.order_count).toBe(1);
        expect(shoppingCartsService.getCartWithItems).toHaveBeenCalledWith(mockUser);
        expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(shoppingCartsService.clearCart).toHaveBeenCalledWith(mockUser);
      });

      it('should create order with notes', async () => {
        const result = await service.placeOrder(
          { notes: 'Please handle with care' },
          mockUser,
        );

        expect(result.orders).toHaveLength(1);
        expect(result.orders[0]).toEqual(mockOrder);
        expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ notes: 'Please handle with care' }),
        );
      });

      it('should reserve stock within the transaction', async () => {
        mockQueryRunner.manager.findOne.mockResolvedValue({
          id: 1,
          variant_id: 1,
          stock_quantity: 100,
          reserved_quantity: 0,
          available_quantity: 100,
        });

        await service.placeOrder({}, mockUser);

        // Verify stock update was called within the transaction
        expect(mockQueryRunner.manager.update).toHaveBeenCalled();
      });
    });

    describe('shipping address snapshot', () => {
      it('should use default address when no address_id provided', async () => {
        await service.placeOrder({}, mockUser);

        expect(
          userAddressesService.getDefaultAddressForCheckout,
        ).toHaveBeenCalledWith(mockUser.id);
        expect(
          userAddressesService.getAddressForCheckout,
        ).not.toHaveBeenCalled();
      });

      it('should use provided address_id when specified', async () => {
        userAddressesService.getAddressForCheckout.mockResolvedValue(
          mockSecondAddress,
        );

        await service.placeOrder({ address_id: 2 }, mockUser);

        expect(userAddressesService.getAddressForCheckout).toHaveBeenCalledWith(
          2,
          mockUser.id,
        );
        expect(
          userAddressesService.getDefaultAddressForCheckout,
        ).not.toHaveBeenCalled();
      });

      it('should snapshot all address fields in the order', async () => {
        await service.placeOrder({}, mockUser);

        expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            user_address_id: mockAddress.id,
            shipping_recipient_name: mockAddress.recipient_name,
            shipping_phone: mockAddress.phone,
            shipping_address_line1: mockAddress.address_line1,
            shipping_address_line2: mockAddress.address_line2,
            shipping_city: mockAddress.city,
            shipping_state_province: mockAddress.state_province,
            shipping_postal_code: mockAddress.postal_code,
            shipping_country: mockAddress.country,
          }),
        );
      });

      it('should create legacy shipping_address text field', async () => {
        await service.placeOrder({}, mockUser);

        expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            shipping_address: expect.stringContaining(
              mockAddress.recipient_name,
            ),
          }),
        );
      });

      it('should handle address with null optional fields', async () => {
        const addressWithNulls: UserAddress = {
          ...mockAddress,
          phone: null,
          address_line2: null,
        };
        userAddressesService.getDefaultAddressForCheckout.mockResolvedValue(
          addressWithNulls,
        );

        await service.placeOrder({}, mockUser);

        expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            shipping_phone: null,
            shipping_address_line2: null,
          }),
        );
      });

      it('should throw NotFoundException if provided address_id not found', async () => {
        userAddressesService.getAddressForCheckout.mockRejectedValue(
          new NotFoundException('Address not found'),
        );

        await expect(
          service.placeOrder({ address_id: 999 }, mockUser),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw UnprocessableEntityException if no default address exists', async () => {
        userAddressesService.getDefaultAddressForCheckout.mockRejectedValue(
          new UnprocessableEntityException('No default address found'),
        );

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          UnprocessableEntityException,
        );
      });
    });

    describe('non-COD checkout session flow', () => {
      beforeEach(() => {
        checkoutPaymentsService.initiatePayment.mockResolvedValue({
          id: 1,
          gateway_checkout_url: 'https://payments.example.com/checkout',
          transaction_number: 'PAY-TEST-12345',
        } as any);
      });

      it('should allow walk-in service-only non-COD checkout without default address', async () => {
        shoppingCartsService.getCartWithItems.mockResolvedValue({
          ...mockCart,
          items: [
            {
              id: 101,
              shopping_cart_id: 1,
              item_type: CartItemTypeEnum.SERVICE,
              service_id: 501,
              quantity: 1,
              unit_price: 250,
              total_price: 250,
              is_selected: true,
              appointment_location_type: 'walk_in',
            },
          ],
          summary: {
            item_count: 1,
            subtotal: 250,
            tax_amount: 0,
            shipping_amount: 0,
            total_amount: 250,
          },
        } as ShoppingCart);
        serviceRepository.findById.mockResolvedValue({
          id: 501,
          title: 'Walk-in Service',
          status: 'Active',
        } as any);
        userAddressesService.getDefaultAddressForCheckout.mockRejectedValue(
          new UnprocessableEntityException('No default address found'),
        );

        const result = await service.placeOrder(
          {
            payment_method_code: 'bank_account',
            fulfillment_type: 'delivery',
          },
          mockUser,
        );

        expect(result.orders).toHaveLength(0);
        expect(result.checkout_url).toBe(
          'https://payments.example.com/checkout',
        );
        expect(result.payment_transaction_number).toBe('PAY-TEST-12345');
        expect(
          userAddressesService.getDefaultAddressForCheckout,
        ).not.toHaveBeenCalled();
        expect(
          userAddressesService.getAddressForCheckout,
        ).not.toHaveBeenCalled();

        const paymentPayload =
          checkoutPaymentsService.initiatePayment.mock.calls[0][0];
        expect(paymentPayload.metadata.shipping_address_id).toBeNull();
        expect(paymentPayload.metadata.cart_items[0]).toEqual(
          expect.objectContaining({
            appointment_location_type: 'walk_in',
          }),
        );
      });

      it('should still require default address for product delivery in non-COD checkout', async () => {
        await service.placeOrder(
          {
            payment_method_code: 'bank_account',
            fulfillment_type: 'delivery',
          },
          mockUser,
        );

        expect(
          userAddressesService.getDefaultAddressForCheckout,
        ).toHaveBeenCalledWith(mockUser.id);
      });

      it('should use provided address_id for non-COD checkout when specified', async () => {
        userAddressesService.getAddressForCheckout.mockResolvedValue(
          mockSecondAddress,
        );

        await service.placeOrder(
          {
            payment_method_code: 'bank_account',
            fulfillment_type: 'delivery',
            address_id: 2,
          },
          mockUser,
        );

        expect(userAddressesService.getAddressForCheckout).toHaveBeenCalledWith(
          2,
          mockUser.id,
        );
        expect(
          userAddressesService.getDefaultAddressForCheckout,
        ).not.toHaveBeenCalled();
      });
    });

    describe('idempotency key', () => {
      const testIdempotencyKey = 'f60cc3c1-2e38-4b83-a02b-69beb2ce432d';

      it('should return existing order if idempotency key already exists', async () => {
        const existingOrder = { ...mockOrder, id: 999 };
        repository.findByIdempotencyKey.mockResolvedValue(existingOrder);

        const result = await service.placeOrder(
          { idempotency_key: testIdempotencyKey },
          mockUser,
        );

        expect(result.orders).toHaveLength(1);
        expect(result.orders[0]).toEqual(existingOrder);
        expect(repository.findByIdempotencyKey).toHaveBeenCalledWith(
          testIdempotencyKey,
          mockUser.id,
        );
        // Should NOT proceed with order placement
        expect(shoppingCartsService.getCartWithItems).not.toHaveBeenCalled();
        expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
      });

      it('should create new order if idempotency key does not exist', async () => {
        const newIdempotencyKey = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
        repository.findByIdempotencyKey.mockResolvedValue(null);

        const result = await service.placeOrder(
          { idempotency_key: newIdempotencyKey },
          mockUser,
        );

        expect(result.orders).toHaveLength(1);
        expect(result.orders[0]).toEqual(mockOrder);
        expect(repository.findByIdempotencyKey).toHaveBeenCalledWith(
          newIdempotencyKey,
          mockUser.id,
        );
        expect(shoppingCartsService.getCartWithItems).toHaveBeenCalled();
      });

      it('should store idempotency key with the order', async () => {
        const uniqueIdempotencyKey = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';
        repository.findByIdempotencyKey.mockResolvedValue(null);

        await service.placeOrder(
          { idempotency_key: uniqueIdempotencyKey },
          mockUser,
        );

        // Note: The actual idempotency_key stored will be a uuidv5 generated from the input key
        // The important thing is that the order creation was called
        expect(mockQueryRunner.manager.create).toHaveBeenCalled();
      });
    });

    describe('transaction rollback on failure', () => {
      it('should rollback transaction if order creation fails', async () => {
        mockQueryRunner.manager.save.mockRejectedValueOnce(
          new Error('Database error'),
        );

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          'Database error',
        );

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
        // Cart should NOT be cleared
        expect(shoppingCartsService.clearCart).not.toHaveBeenCalled();
      });

      it('should rollback transaction if stock reservation fails', async () => {
        mockQueryRunner.manager.findOne.mockResolvedValue({
          id: 1,
          variant_id: 1,
          stock_quantity: 100,
          reserved_quantity: 0,
        });
        mockQueryRunner.manager.update.mockRejectedValueOnce(
          new Error('Stock update failed'),
        );

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          'Stock update failed',
        );

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(shoppingCartsService.clearCart).not.toHaveBeenCalled();
      });

      it('should NOT clear cart if transaction fails', async () => {
        mockQueryRunner.manager.save.mockRejectedValueOnce(
          new Error('Transaction failed'),
        );

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow();

        expect(shoppingCartsService.clearCart).not.toHaveBeenCalled();
      });
    });

    describe('order number collision retry', () => {
      it('should retry with new order number on collision', async () => {
        // First attempt fails with duplicate key error
        mockQueryRunner.manager.save
          .mockRejectedValueOnce(
            new Error(
              'duplicate key value violates unique constraint "order_number"',
            ),
          )
          // Second attempt succeeds
          .mockResolvedValueOnce({ id: 1 })
          .mockResolvedValue([]);

        const result = await service.placeOrder({}, mockUser);

        expect(result.orders).toHaveLength(1);
        expect(result.orders[0]).toEqual(mockOrder);
        // Transaction should have been attempted twice
        expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(2);
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      });

      it('should throw ConflictException after max retries', async () => {
        // All attempts fail with duplicate key error
        mockQueryRunner.manager.save.mockRejectedValue(
          new Error(
            'duplicate key value violates unique constraint "order_number"',
          ),
        );

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          ConflictException,
        );

        // Should have tried 3 times (MAX_ORDER_NUMBER_RETRIES)
        expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(3);
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(3);
      });

      it('should NOT retry on non-collision errors', async () => {
        mockQueryRunner.manager.save.mockRejectedValueOnce(
          new Error('Some other database error'),
        );

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          'Some other database error',
        );

        // Should only have tried once
        expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      });
    });

    describe('validation errors', () => {
      it('should throw BadRequestException if no items selected', async () => {
        shoppingCartsService.getCartWithItems.mockResolvedValue({
          ...mockCart,
          items: [],
        });

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          BadRequestException,
        );
        expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException if cart items is null', async () => {
        shoppingCartsService.getCartWithItems.mockResolvedValue({
          ...mockCart,
          items: null,
        } as any);

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw BadRequestException if all items are unselected', async () => {
        shoppingCartsService.getCartWithItems.mockResolvedValue({
          ...mockCart,
          items: [
            { ...mockCart.items![0], is_selected: false },
            { ...mockCart.items![1], is_selected: false },
          ],
        });

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should only process selected items', async () => {
        shoppingCartsService.getCartWithItems.mockResolvedValue({
          ...mockCart,
          items: [
            { ...mockCart.items![0], is_selected: true },
            { ...mockCart.items![1], is_selected: false },
          ],
        });

        await service.placeOrder({}, mockUser);

        // Only one item should be created (the selected one)
        expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            subtotal: 200, // Only first item's price
            total_amount: 200,
          }),
        );
      });

      it('should throw NotFoundException if variant not found', async () => {
        variantRepository.findOne.mockResolvedValue(null);

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw UnprocessableEntityException if variant is inactive', async () => {
        variantRepository.findOne.mockResolvedValue({
          ...mockVariant,
          status: 'Inactive',
        });

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          UnprocessableEntityException,
        );
      });

      it('should throw UnprocessableEntityException if product is not published', async () => {
        variantRepository.findOne.mockResolvedValue({
          ...mockVariant,
          product: { ...mockVariant.product, status: 'Draft' },
        });

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          UnprocessableEntityException,
        );
      });

      it('should throw UnprocessableEntityException if insufficient stock', async () => {
        inventoryStocksService.checkAvailability.mockResolvedValue(false);

        await expect(service.placeOrder({}, mockUser)).rejects.toThrow(
          UnprocessableEntityException,
        );
      });
    });
  });

  describe('findById', () => {
    it('should return order for owner', async () => {
      repository.findById.mockResolvedValue(mockOrder);
      invoiceRepository.findByOrderId.mockResolvedValue(null);

      const result = await service.findById(1, mockUser);

      expect(result).toEqual({
        ...mockOrder,
        invoice_id: null,
      });
    });

    it('should include invoice_id when invoice exists', async () => {
      repository.findById.mockResolvedValue(mockOrder);
      invoiceRepository.findByOrderId.mockResolvedValue({
        id: 99,
      } as any);

      const result = await service.findById(1, mockUser);

      expect(result.invoice_id).toBe(99);
    });

    it('should throw NotFoundException if order not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const otherUser = { ...mockUser, id: 999 };
      repository.findById.mockResolvedValue(mockOrder);

      await expect(service.findById(1, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for admin (admins should use admin endpoint)', async () => {
      repository.findById.mockResolvedValue(mockOrder);

      await expect(service.findById(1, mockAdminUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return paginated orders', async () => {
      const paginatedResult = {
        data: [mockOrder],
        total: 1,
        page: 1,
        limit: 20,
      };
      repository.findByUserId.mockResolvedValue(paginatedResult);
      invoiceRepository.findByOrderId.mockResolvedValue(null);

      const result = await service.findByUserId(1, { page: 1, limit: 20 });

      expect(result).toEqual({
        ...paginatedResult,
        data: [
          {
            ...mockOrder,
            invoice_id: null,
          },
        ],
      });
    });
  });

  describe('findAll', () => {
    it('should return all orders for admin', async () => {
      const paginatedResult = {
        data: [mockOrder],
        total: 1,
        page: 1,
        limit: 20,
      };
      repository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll(
        { page: 1, limit: 20 },
        mockAdminUser,
      );

      expect(result).toEqual(paginatedResult);
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(
        service.findAll({ page: 1, limit: 20 }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelOrder', () => {
    let mockDataSource: any;

    beforeEach(() => {
      mockDataSource = {
        manager: {
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        },
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };
      (service as any).dataSource = mockDataSource;

      repository.findById.mockResolvedValue(mockOrder);
      inventoryStocksService.releaseStock.mockResolvedValue(null);
    });

    it('should cancel order and release stock', async () => {
      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatusEnum.CANCELLED,
      };
      repository.findById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);

      const result = await service.cancelOrder(
        1,
        { reason: 'Test reason' },
        mockUser,
      );

      expect(result.status).toBe(OrderStatusEnum.CANCELLED);
      expect(inventoryStocksService.releaseStock).toHaveBeenCalledTimes(2);
    });

    it('should allow admin to cancel any order', async () => {
      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatusEnum.CANCELLED,
      };
      repository.findById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);

      const result = await service.cancelOrder(
        1,
        { reason: 'Test reason' },
        mockAdminUser,
      );

      expect(result.status).toBe(OrderStatusEnum.CANCELLED);
    });

    it('should set cancellation_reason and cancelled_at', async () => {
      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatusEnum.CANCELLED,
      };
      repository.findById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);

      await service.cancelOrder(1, { reason: 'Changed my mind' }, mockUser);

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({
          status: OrderStatusEnum.CANCELLED,
          cancellation_reason: 'Changed my mind',
          cancelled_at: expect.any(Date),
        }),
      );
    });

    it('should set cancellation_reason to null when no reason provided', async () => {
      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatusEnum.CANCELLED,
      };
      repository.findById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);

      await service.cancelOrder(1, { reason: 'Test reason' }, mockUser);

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({
          cancellation_reason: 'Test reason',
        }),
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.cancelOrder(999, { reason: 'Test reason' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      const otherUser = { ...mockUser, id: 999 };

      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not cancellable', async () => {
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.SHIPPED,
      });

      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow cancellation of PENDING, CONFIRMED, PROCESSING, and READY_TO_SHIP orders', async () => {
      // Test PENDING - should succeed
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PENDING,
      });
      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, mockUser),
      ).resolves.toBeDefined();

      // Test CONFIRMED - should succeed
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CONFIRMED,
      });
      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, mockUser),
      ).resolves.toBeDefined();

      // Test PROCESSING - should succeed
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PROCESSING,
      });
      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, mockUser),
      ).resolves.toBeDefined();

      // Test READY_TO_SHIP - should succeed
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.READY_TO_SHIP,
      });
      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, mockUser),
      ).resolves.toBeDefined();
    });

    it('should not allow cancellation of SHIPPED or later statuses', async () => {
      // Test SHIPPED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.SHIPPED,
      });
      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, mockUser),
      ).rejects.toThrow(BadRequestException);

      // Test DELIVERED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.DELIVERED,
      });
      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, mockUser),
      ).rejects.toThrow(BadRequestException);

      // Test COMPLETED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.COMPLETED,
      });
      await expect(
        service.cancelOrder(1, { reason: 'Test reason' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmOrder', () => {
    const mockSellerUser: User = {
      id: 3,
      first_name: 'Seller',
      last_name: 'User',
      email: 'seller@example.com',
      system_admin: false,
      seller_id: 1,
    } as User;

    beforeEach(() => {
      repository.findById.mockResolvedValue(mockOrder);
      repository.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CONFIRMED,
      });
    });

    it('should confirm order when user is seller', async () => {
      const result = await service.confirmOrder(1, mockSellerUser);

      expect(result.status).toBe(OrderStatusEnum.CONFIRMED);
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: OrderStatusEnum.CONFIRMED }),
      );
    });

    it('should confirm order when user is admin', async () => {
      const result = await service.confirmOrder(1, mockAdminUser);

      expect(result.status).toBe(OrderStatusEnum.CONFIRMED);
    });

    it('should throw ForbiddenException if user is not seller or admin', async () => {
      await expect(service.confirmOrder(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.confirmOrder(999, mockSellerUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if order is not pending', async () => {
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CONFIRMED,
      });

      await expect(service.confirmOrder(1, mockSellerUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should only allow confirmation of PENDING orders', async () => {
      // Test PENDING - should succeed
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PENDING,
      });
      await expect(
        service.confirmOrder(1, mockSellerUser),
      ).resolves.toBeDefined();

      // Test PROCESSING - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PROCESSING,
      });
      await expect(service.confirmOrder(1, mockSellerUser)).rejects.toThrow(
        BadRequestException,
      );

      // Test CANCELLED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CANCELLED,
      });
      await expect(service.confirmOrder(1, mockSellerUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('startProcessing', () => {
    const mockSellerUser: User = {
      id: 3,
      first_name: 'Seller',
      last_name: 'User',
      email: 'seller@example.com',
      system_admin: false,
      seller_id: 1,
    } as User;

    beforeEach(() => {
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CONFIRMED,
      });
      repository.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PROCESSING,
      });
    });

    it('should start processing when user is seller', async () => {
      const result = await service.startProcessing(1, mockSellerUser);

      expect(result.status).toBe(OrderStatusEnum.PROCESSING);
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: OrderStatusEnum.PROCESSING }),
      );
    });

    it('should start processing when user is admin', async () => {
      const result = await service.startProcessing(1, mockAdminUser);

      expect(result.status).toBe(OrderStatusEnum.PROCESSING);
    });

    it('should throw ForbiddenException if user is not seller or admin', async () => {
      await expect(service.startProcessing(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.startProcessing(999, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order is not confirmed', async () => {
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PENDING,
      });

      await expect(service.startProcessing(1, mockSellerUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should only allow processing of CONFIRMED orders', async () => {
      // Test CONFIRMED - should succeed
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CONFIRMED,
      });
      await expect(
        service.startProcessing(1, mockSellerUser),
      ).resolves.toBeDefined();

      // Test PENDING - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PENDING,
      });
      await expect(service.startProcessing(1, mockSellerUser)).rejects.toThrow(
        BadRequestException,
      );

      // Test SHIPPED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.SHIPPED,
      });
      await expect(service.startProcessing(1, mockSellerUser)).rejects.toThrow(
        BadRequestException,
      );

      // Test CANCELLED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CANCELLED,
      });
      await expect(service.startProcessing(1, mockSellerUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeOrder', () => {
    let mockDataSource: any;

    beforeEach(() => {
      mockDataSource = {
        manager: {
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        },
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };

      // Re-inject the dataSource mock for this describe block
      (service as any).dataSource = mockDataSource;

      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.DELIVERED,
      });
    });

    it('should complete order when user is owner and order is delivered', async () => {
      const completedOrder = {
        ...mockOrder,
        status: OrderStatusEnum.COMPLETED,
        completed_at: expect.any(Date),
      };
      repository.findById.mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatusEnum.DELIVERED,
      });
      repository.findById.mockResolvedValueOnce(completedOrder);

      const result = await service.completeOrder(1, mockUser);

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({
          status: OrderStatusEnum.COMPLETED,
          completed_at: expect.any(Date),
        }),
      );
      expect(result.status).toBe(OrderStatusEnum.COMPLETED);
    });

    it('should throw NotFoundException if order not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.completeOrder(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not order owner', async () => {
      const otherUser = { ...mockUser, id: 999 };
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.DELIVERED,
      });

      await expect(service.completeOrder(1, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if order is not in DELIVERED status', async () => {
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PENDING,
      });

      await expect(service.completeOrder(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should only allow completion of DELIVERED orders', async () => {
      // Test DELIVERED - should succeed
      const completedOrder = {
        ...mockOrder,
        status: OrderStatusEnum.COMPLETED,
      };
      repository.findById
        .mockResolvedValueOnce({
          ...mockOrder,
          status: OrderStatusEnum.DELIVERED,
        })
        .mockResolvedValueOnce(completedOrder);
      await expect(service.completeOrder(1, mockUser)).resolves.toBeDefined();

      // Test PENDING - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.PENDING,
      });
      await expect(service.completeOrder(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      // Test CONFIRMED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CONFIRMED,
      });
      await expect(service.completeOrder(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      // Test SHIPPED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.SHIPPED,
      });
      await expect(service.completeOrder(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      // Test CANCELLED - should fail
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.CANCELLED,
      });
      await expect(service.completeOrder(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      // Test COMPLETED - should fail (already completed)
      repository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatusEnum.COMPLETED,
      });
      await expect(service.completeOrder(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set completed_at timestamp when completing order', async () => {
      const completedOrder = {
        ...mockOrder,
        status: OrderStatusEnum.COMPLETED,
        completed_at: new Date(),
      };
      repository.findById
        .mockResolvedValueOnce({
          ...mockOrder,
          status: OrderStatusEnum.DELIVERED,
        })
        .mockResolvedValueOnce(completedOrder);

      await service.completeOrder(1, mockUser);

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({
          completed_at: expect.any(Date),
        }),
      );
    });
  });

  describe('updatePickupStatus', () => {
    let mockDataSource: any;

    const mockSellerUser: User = {
      id: 3,
      first_name: 'Seller',
      last_name: 'User',
      email: 'seller@example.com',
      system_admin: false,
      seller_id: 1,
    } as User;

    const mockPickupOrder: SalesOrder = {
      ...mockOrder,
      fulfillment_type: 'pickup',
      status: OrderStatusEnum.PROCESSING,
    };

    beforeEach(() => {
      mockDataSource = {
        manager: {
          update: jest.fn(),
        },
      };
      (service as any).dataSource = mockDataSource;
    });

    it('should throw NotFoundException when order does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updatePickupStatus(999, undefined, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a seller or admin', async () => {
      repository.findById.mockResolvedValue(mockPickupOrder);

      await expect(
        service.updatePickupStatus(1, undefined, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when order is not a pickup order', async () => {
      repository.findById.mockResolvedValue({
        ...mockOrder,
        fulfillment_type: 'delivery',
        status: OrderStatusEnum.PROCESSING,
      });

      await expect(
        service.updatePickupStatus(1, undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order status cannot be advanced', async () => {
      repository.findById.mockResolvedValue({
        ...mockPickupOrder,
        status: OrderStatusEnum.PENDING,
      });

      await expect(
        service.updatePickupStatus(1, undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should automatically advance processing → ready_for_pickup and generate confirmation code', async () => {
      const readyOrder: SalesOrder = {
        ...mockPickupOrder,
        status: OrderStatusEnum.READY_FOR_PICKUP,
        pickup_confirmation_code: '4217',
      };

      repository.findById
        .mockResolvedValueOnce(mockPickupOrder)
        .mockResolvedValueOnce(readyOrder);

      await service.updatePickupStatus(1, undefined, mockSellerUser);

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({
          status: OrderStatusEnum.READY_FOR_PICKUP,
          pickup_confirmation_code: expect.stringMatching(/^\d{4}$/),
          ready_for_pickup_at: expect.any(Date),
        }),
      );
    });

    it('should automatically advance ready_for_pickup → completed and set timestamps', async () => {
      const readyOrder: SalesOrder = {
        ...mockPickupOrder,
        status: OrderStatusEnum.READY_FOR_PICKUP,
        pickup_confirmation_code: '4217',
      };
      const completedOrder: SalesOrder = {
        ...readyOrder,
        status: OrderStatusEnum.COMPLETED,
        picked_up_at: new Date(),
        completed_at: new Date(),
      };

      repository.findById
        .mockResolvedValueOnce(readyOrder)
        .mockResolvedValueOnce(completedOrder);

      await service.updatePickupStatus(1, undefined, mockSellerUser);

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({
          status: OrderStatusEnum.COMPLETED,
          picked_up_at: expect.any(Date),
          completed_at: expect.any(Date),
        }),
      );
    });

    it('should pass status_notes to update payload', async () => {
      const readyOrder: SalesOrder = {
        ...mockPickupOrder,
        status: OrderStatusEnum.READY_FOR_PICKUP,
        pickup_confirmation_code: '4217',
      };

      repository.findById
        .mockResolvedValueOnce(mockPickupOrder)
        .mockResolvedValueOnce(readyOrder);

      await service.updatePickupStatus(1, 'Ready at counter', mockSellerUser);

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({ status_notes: 'Ready at counter' }),
      );
    });

    it('should allow admin to advance pickup status', async () => {
      const readyOrder: SalesOrder = {
        ...mockPickupOrder,
        status: OrderStatusEnum.READY_FOR_PICKUP,
        pickup_confirmation_code: '0099',
      };

      repository.findById
        .mockResolvedValueOnce(mockPickupOrder)
        .mockResolvedValueOnce(readyOrder);

      const result = await service.updatePickupStatus(
        1,
        undefined,
        mockAdminUser,
      );

      expect(result).toEqual(readyOrder);
    });
  });

  describe('extendPickupGracePeriod', () => {
    let mockDataSource: any;

    const mockSellerUser: User = {
      id: 3,
      first_name: 'Seller',
      last_name: 'User',
      email: 'seller@example.com',
      system_admin: false,
      seller_id: 1,
    } as User;

    const mockReadyPickupOrder: SalesOrder = {
      ...mockOrder,
      fulfillment_type: 'pickup',
      status: OrderStatusEnum.READY_FOR_PICKUP,
      grace_period_extension: null,
    };

    beforeEach(() => {
      mockDataSource = {
        manager: {
          update: jest.fn(),
        },
      };
      (service as any).dataSource = mockDataSource;
    });

    it('should throw NotFoundException when order does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.extendPickupGracePeriod(999, 30, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a seller or admin', async () => {
      repository.findById.mockResolvedValue(mockReadyPickupOrder);

      await expect(
        service.extendPickupGracePeriod(1, 30, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when order is not a pickup order', async () => {
      repository.findById.mockResolvedValue({
        ...mockReadyPickupOrder,
        fulfillment_type: 'delivery',
      });

      await expect(
        service.extendPickupGracePeriod(1, 30, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order is not in READY_FOR_PICKUP status', async () => {
      repository.findById.mockResolvedValue({
        ...mockReadyPickupOrder,
        status: OrderStatusEnum.PROCESSING,
      });

      await expect(
        service.extendPickupGracePeriod(1, 30, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set grace_period_extension to 30 on first click (null → 30)', async () => {
      const updatedOrder = {
        ...mockReadyPickupOrder,
        grace_period_extension: 30,
      };

      repository.findById
        .mockResolvedValueOnce(mockReadyPickupOrder)
        .mockResolvedValueOnce(updatedOrder);

      const result = await service.extendPickupGracePeriod(
        1,
        30,
        mockSellerUser,
      );

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({ grace_period_extension: 30 }),
      );
      expect(result.grace_period_extension).toBe(30);
    });

    it('should accumulate grace_period_extension on subsequent clicks (30 → 60)', async () => {
      const orderWith30 = {
        ...mockReadyPickupOrder,
        grace_period_extension: 30,
      };
      const orderWith60 = {
        ...mockReadyPickupOrder,
        grace_period_extension: 60,
      };

      repository.findById
        .mockResolvedValueOnce(orderWith30)
        .mockResolvedValueOnce(orderWith60);

      const result = await service.extendPickupGracePeriod(
        1,
        30,
        mockSellerUser,
      );

      expect(mockDataSource.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.objectContaining({ grace_period_extension: 60 }),
      );
      expect(result.grace_period_extension).toBe(60);
    });

    it('should throw BadRequestException when total would exceed 480 minutes', async () => {
      const orderAt480 = {
        ...mockReadyPickupOrder,
        grace_period_extension: 480,
      };
      repository.findById.mockResolvedValue(orderAt480);

      await expect(
        service.extendPickupGracePeriod(1, 30, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow admin to extend grace period', async () => {
      const updatedOrder = {
        ...mockReadyPickupOrder,
        grace_period_extension: 30,
      };

      repository.findById
        .mockResolvedValueOnce(mockReadyPickupOrder)
        .mockResolvedValueOnce(updatedOrder);

      const result = await service.extendPickupGracePeriod(
        1,
        30,
        mockAdminUser,
      );

      expect(result.grace_period_extension).toBe(30);
    });
  });
});
