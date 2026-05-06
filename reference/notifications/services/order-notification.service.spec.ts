import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderNotificationService } from './order-notification.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationsService } from '../notifications.service';
import { StorageService } from '@/storage/storage.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SalesOrder } from '@/sales-orders/domain/sales-order';

describe('OrderNotificationService', () => {
  let service: OrderNotificationService;
  let notificationsService: jest.Mocked<NotificationsService>;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let sellerRepository: jest.Mocked<Repository<SellerEntity>>;

  // Mock data
  const mockCustomer: Partial<UserEntity> = {
    id: 10,
    email: 'customer@example.com',
    first_name: 'John',
    last_name: 'Doe',
  };

  const mockSeller: Partial<SellerEntity> = {
    id: 1,
    user_id: 5,
    store_name: 'Test Store',
    user: {
      id: 5,
      email: 'seller@example.com',
      first_name: 'Seller',
      last_name: 'User',
    } as UserEntity,
  };

  const mockOrder: Partial<SalesOrder> = {
    id: 100,
    order_number: 'ORD-TEST-001',
    user_id: 10,
    total_amount: 1000,
    subtotal: 900,
    shipping_amount: 50,
    tax_amount: 50,
    tracking_number: 'TRACK-123',
    shipping_provider: 'JNT Express',
    shipping_recipient_name: 'John Doe',
    shipping_phone: '+639171234567',
    shipping_address_line1: '123 Main St',
    shipping_city: 'Makati',
    shipping_state_province: 'Metro Manila',
    shipping_postal_code: '1234',
    shipping_country: 'Philippines',
    user: {
      id: 10,
      first_name: 'John',
      last_name: 'Doe',
    } as any,
    seller: {
      id: 1,
      store_name: 'Test Store',
    } as any,
    items: [
      {
        id: 1,
        quantity: 2,
        unit_price: 450,
        total_price: 900,
        variant: {
          id: 5,
          variant_name: 'Large - Red',
          variant_image_url: 'https://example.com/variant.jpg',
          product: {
            id: 1,
            product_name: 'T-Shirt',
            product_image_url: 'https://example.com/product.jpg',
          },
        },
      },
    ] as any,
  };

  const mockNotificationsService = {
    sendNewOrderToSeller: jest.fn().mockResolvedValue({}),
    sendOrderConfirmed: jest.fn().mockResolvedValue({}),
    sendOrderProcessing: jest.fn().mockResolvedValue({}),
    sendOrderReadyToShip: jest.fn().mockResolvedValue({}),
    sendOrderShipped: jest.fn().mockResolvedValue({}),
    sendOrderOutForDelivery: jest.fn().mockResolvedValue({}),
    sendOrderDelivered: jest.fn().mockResolvedValue({}),
    sendOrderCompleted: jest.fn().mockResolvedValue({}),
    sendOrderCompletedToSeller: jest.fn().mockResolvedValue({}),
    sendOrderCancelled: jest.fn().mockResolvedValue({}),
    sendOrderCancelledToSeller: jest.fn().mockResolvedValue({}),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockSellerRepository = {
    findOne: jest.fn(),
  };

  const mockPushNotificationService = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockStorageService = {
    getSignedUrl: jest
      .fn()
      .mockImplementation((path) =>
        Promise.resolve(`https://signed-url.test/${path}`),
      ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderNotificationService,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: PushNotificationService,
          useValue: mockPushNotificationService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(SellerEntity),
          useValue: mockSellerRepository,
        },
      ],
    }).compile();

    service = module.get<OrderNotificationService>(OrderNotificationService);
    notificationsService = module.get(NotificationsService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    sellerRepository = module.get(getRepositoryToken(SellerEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // sendOrderPlacedNotification Tests
  // ==========================================
  describe('sendOrderPlacedNotification', () => {
    it('should send notification to seller with email when seller exists', async () => {
      sellerRepository.findOne.mockResolvedValue(mockSeller as SellerEntity);

      await service.sendOrderPlacedNotification(mockOrder as SalesOrder);

      expect(sellerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(notificationsService.sendNewOrderToSeller).toHaveBeenCalledWith(
        1, // sellerId
        100, // orderId
        'ORD-TEST-001', // orderNumber
        'John Doe', // customerName
        1000, // totalAmount
        true, // sendEmail
        'seller@example.com', // sellerEmail
        'Test Store', // storeName
        expect.anything(), // orderDetails
      );
    });

    it('should warn and return early when seller relation not loaded', async () => {
      const orderWithoutSeller = { ...mockOrder, seller: undefined };
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      await service.sendOrderPlacedNotification(
        orderWithoutSeller as SalesOrder,
      );

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Seller relation not loaded'),
      );
      expect(notificationsService.sendNewOrderToSeller).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      sellerRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await service.sendOrderPlacedNotification(mockOrder as SalesOrder);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send order placed notification'),
      );
    });

    it('should use fallback customer name when user not loaded', async () => {
      const orderWithoutUser = { ...mockOrder, user: undefined };
      sellerRepository.findOne.mockResolvedValue(mockSeller as SellerEntity);

      await service.sendOrderPlacedNotification(orderWithoutUser as SalesOrder);

      expect(notificationsService.sendNewOrderToSeller).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'Customer', // Fallback customer name
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(), // orderDetails
      );
    });
  });

  // ==========================================
  // sendOrderConfirmedNotification Tests
  // ==========================================
  describe('sendOrderConfirmedNotification', () => {
    it('should send confirmation to customer with email and orderDetails', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderConfirmedNotification(mockOrder as SalesOrder);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 10 },
      });
      expect(notificationsService.sendOrderConfirmed).toHaveBeenCalledWith(
        10, // customerId
        100, // orderId
        'ORD-TEST-001', // orderNumber
        'Test Store', // storeName
        true, // sendEmail
        'customer@example.com', // customerEmail
        'John Doe', // customerName
        expect.objectContaining({
          orderItems: expect.arrayContaining([
            expect.objectContaining({
              product_name: 'T-Shirt',
              variant_name: 'Large - Red',
              quantity: 2,
              unit_price: 450,
              total_price: 900,
            }),
          ]),
          subtotal: 900,
          shippingAmount: 50,
          taxAmount: 50,
          totalAmount: 1000,
          shippingAddress: expect.stringContaining('John Doe'),
          sellerName: 'Test Store',
        }),
      );
    });

    it('should use default store name when seller has no store_name', async () => {
      const orderWithNoStoreName = {
        ...mockOrder,
        seller: { id: 1 },
      };
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderConfirmedNotification(
        orderWithNoStoreName as SalesOrder,
      );

      expect(notificationsService.sendOrderConfirmed).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'Store', // Default store name
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.any(Object), // orderDetails
      );
    });

    it('should handle customer not found in repository', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await service.sendOrderConfirmedNotification(mockOrder as SalesOrder);

      expect(notificationsService.sendOrderConfirmed).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        'Test Store',
        true,
        undefined, // No email
        undefined, // No name
        expect.any(Object), // orderDetails
      );
    });
  });

  // ==========================================
  // sendOrderProcessingNotification Tests
  // ==========================================
  describe('sendOrderProcessingNotification', () => {
    it('should send processing notification to customer with email and orderDetails', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderProcessingNotification(mockOrder as SalesOrder);

      expect(notificationsService.sendOrderProcessing).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        'Test Store',
        true,
        'customer@example.com',
        'John Doe',
        expect.objectContaining({
          orderItems: expect.any(Array),
          subtotal: 900,
          shippingAmount: 50,
          taxAmount: 50,
          totalAmount: 1000,
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      userRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await service.sendOrderProcessingNotification(mockOrder as SalesOrder);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send order processing notification'),
      );
    });
  });

  // ==========================================
  // sendOrderReadyToShipNotification Tests
  // ==========================================
  describe('sendOrderReadyToShipNotification', () => {
    it('should send ready to ship notification to customer with email and orderDetails', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderReadyToShipNotification(mockOrder as SalesOrder);

      expect(notificationsService.sendOrderReadyToShip).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        'Test Store',
        true,
        'customer@example.com',
        'John Doe',
        expect.objectContaining({
          orderItems: expect.any(Array),
          subtotal: 900,
          totalAmount: 1000,
        }),
      );
    });

    it('should include store name in notification', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);
      const orderWithCustomStore = {
        ...mockOrder,
        seller: { id: 1, store_name: 'Custom Store Name' },
      };

      await service.sendOrderReadyToShipNotification(
        orderWithCustomStore as SalesOrder,
      );

      expect(notificationsService.sendOrderReadyToShip).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'Custom Store Name',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.any(Object), // orderDetails
      );
    });
  });

  // ==========================================
  // sendOrderShippedNotification Tests
  // ==========================================
  describe('sendOrderShippedNotification', () => {
    it('should send shipped notification with tracking number, provider, and orderDetails', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderShippedNotification(
        mockOrder as SalesOrder,
        'NEW-TRACK-456',
        'LBC',
      );

      expect(notificationsService.sendOrderShipped).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        'NEW-TRACK-456', // Passed tracking number
        'LBC', // Passed shipping provider
        true,
        'customer@example.com',
        'John Doe',
        expect.objectContaining({
          orderItems: expect.any(Array),
          subtotal: 900,
          totalAmount: 1000,
          shippingAddress: expect.any(String),
        }),
      );
    });

    it("should use order's tracking info when params not provided", async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderShippedNotification(mockOrder as SalesOrder);

      expect(notificationsService.sendOrderShipped).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        'TRACK-123', // From order
        'JNT Express', // From order
        true,
        'customer@example.com',
        'John Doe',
        expect.objectContaining({
          orderItems: expect.any(Array),
          totalAmount: 1000,
        }),
      );
    });

    it('should handle missing tracking info gracefully', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);
      const orderWithoutTracking = {
        ...mockOrder,
        tracking_number: null,
        shipping_provider: null,
      };

      await service.sendOrderShippedNotification(
        orderWithoutTracking as SalesOrder,
      );

      expect(notificationsService.sendOrderShipped).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        undefined,
        undefined,
        true,
        'customer@example.com',
        'John Doe',
        expect.objectContaining({
          orderItems: expect.any(Array),
        }),
      );
    });
  });

  // ==========================================
  // sendOrderOutForDeliveryNotification Tests
  // ==========================================
  describe('sendOrderOutForDeliveryNotification', () => {
    it('should send out for delivery notification with tracking info', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderOutForDeliveryNotification(
        mockOrder as SalesOrder,
      );

      expect(notificationsService.sendOrderOutForDelivery).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        'TRACK-123',
        'JNT Express',
        true,
        'customer@example.com',
        'John Doe',
        expect.objectContaining({
          orderItems: expect.any(Array),
        }),
      );
    });

    it('should handle missing tracking/provider gracefully', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);
      const orderWithoutTracking = {
        ...mockOrder,
        tracking_number: null,
        shipping_provider: null,
      };

      await service.sendOrderOutForDeliveryNotification(
        orderWithoutTracking as SalesOrder,
      );

      expect(notificationsService.sendOrderOutForDelivery).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        undefined,
        undefined,
        true,
        'customer@example.com',
        'John Doe',
        expect.objectContaining({
          orderItems: expect.any(Array),
        }),
      );
    });
  });

  // ==========================================
  // sendOrderDeliveredNotification Tests
  // ==========================================
  describe('sendOrderDeliveredNotification', () => {
    it('should send delivered notification to customer with email and orderDetails', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderDeliveredNotification(mockOrder as SalesOrder);

      expect(notificationsService.sendOrderDelivered).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        true,
        'customer@example.com',
        'John Doe',
        expect.objectContaining({
          orderItems: expect.any(Array),
          subtotal: 900,
          totalAmount: 1000,
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      userRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await service.sendOrderDeliveredNotification(mockOrder as SalesOrder);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send order delivered notification'),
      );
    });
  });

  // ==========================================
  // sendOrderCompletedNotification Tests
  // ==========================================
  describe('sendOrderCompletedNotification', () => {
    it('should send completion notification to both customer and seller', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);
      sellerRepository.findOne.mockResolvedValue(mockSeller as SellerEntity);

      await service.sendOrderCompletedNotification(mockOrder as SalesOrder);

      // Customer notification
      expect(notificationsService.sendOrderCompleted).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        true,
        'customer@example.com',
        'John Doe',
      );

      // Seller notification
      expect(
        notificationsService.sendOrderCompletedToSeller,
      ).toHaveBeenCalledWith(
        1,
        100,
        'ORD-TEST-001',
        'John Doe',
        1000,
        true,
        'seller@example.com',
        'Test Store',
        expect.anything(), // orderDetails
      );
    });

    it('should only notify customer when seller not available', async () => {
      const orderWithoutSeller = { ...mockOrder, seller: undefined };
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);

      await service.sendOrderCompletedNotification(
        orderWithoutSeller as SalesOrder,
      );

      expect(notificationsService.sendOrderCompleted).toHaveBeenCalled();
      expect(
        notificationsService.sendOrderCompletedToSeller,
      ).not.toHaveBeenCalled();
    });

    it('should include correct customer name for seller notification', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);
      sellerRepository.findOne.mockResolvedValue(mockSeller as SellerEntity);

      await service.sendOrderCompletedNotification(mockOrder as SalesOrder);

      expect(
        notificationsService.sendOrderCompletedToSeller,
      ).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'John Doe', // Customer name from order.user
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(), // orderDetails
      );
    });

    it('should handle errors gracefully', async () => {
      userRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await service.sendOrderCompletedNotification(mockOrder as SalesOrder);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send order completed notification'),
      );
    });
  });

  // ==========================================
  // sendOrderCancelledNotification Tests
  // ==========================================
  describe('sendOrderCancelledNotification', () => {
    beforeEach(() => {
      userRepository.findOne.mockResolvedValue(mockCustomer as UserEntity);
      sellerRepository.findOne.mockResolvedValue(mockSeller as SellerEntity);
    });

    it('should notify seller then customer when cancelled by customer', async () => {
      await service.sendOrderCancelledNotification(
        mockOrder as SalesOrder,
        'customer',
      );

      // Seller should be notified
      expect(
        notificationsService.sendOrderCancelledToSeller,
      ).toHaveBeenCalledWith(
        1,
        100,
        'ORD-TEST-001',
        'John Doe',
        undefined, // No reason
        true,
        'seller@example.com',
        'Test Store',
        expect.anything(), // orderDetails
      );

      // Customer should be notified (confirmation)
      expect(notificationsService.sendOrderCancelled).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        undefined,
        true,
        'customer@example.com',
        'John Doe',
      );
    });

    it('should notify customer then seller when cancelled by seller', async () => {
      await service.sendOrderCancelledNotification(
        mockOrder as SalesOrder,
        'seller',
      );

      // Customer should be notified
      expect(notificationsService.sendOrderCancelled).toHaveBeenCalledWith(
        10,
        100,
        'ORD-TEST-001',
        undefined,
        true,
        'customer@example.com',
        'John Doe',
      );

      // Seller should be notified (confirmation)
      expect(
        notificationsService.sendOrderCancelledToSeller,
      ).toHaveBeenCalledWith(
        1,
        100,
        'ORD-TEST-001',
        'John Doe',
        undefined,
        true,
        'seller@example.com',
        'Test Store',
        expect.anything(), // orderDetails
      );
    });

    it('should include cancellation reason when provided', async () => {
      await service.sendOrderCancelledNotification(
        mockOrder as SalesOrder,
        'customer',
        'Out of stock',
      );

      expect(
        notificationsService.sendOrderCancelledToSeller,
      ).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'Out of stock', // Reason included
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(), // orderDetails
      );

      expect(notificationsService.sendOrderCancelled).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'Out of stock', // Reason included
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should handle missing seller gracefully', async () => {
      const orderWithoutSeller = { ...mockOrder, seller: undefined };

      await service.sendOrderCancelledNotification(
        orderWithoutSeller as SalesOrder,
        'customer',
      );

      // Should still notify customer
      expect(notificationsService.sendOrderCancelled).toHaveBeenCalled();

      // Should not notify seller (no seller)
      expect(
        notificationsService.sendOrderCancelledToSeller,
      ).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      userRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await service.sendOrderCancelledNotification(
        mockOrder as SalesOrder,
        'customer',
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send order cancelled notification'),
      );
    });
  });
});
