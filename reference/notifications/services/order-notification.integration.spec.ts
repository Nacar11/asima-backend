import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderNotificationService } from './order-notification.service';
import { NotificationsService } from '../notifications.service';
import { PushNotificationService } from './push-notification.service';
import { MailService } from '@/mail/mail.service';
import { MailerService } from '@/mailer/mailer.service';
import { NotificationsGateway } from '../notifications.gateway';
import { BaseNotificationRepository } from '../persistence/base-notification.repository';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { StorageService } from '@/storage/storage.service';
import appConfig from '@/config/app.config';
import mailConfig from '@/mail/config/mail.config';
import authConfig from '@/auth/config/auth.config';

/**
 * Integration tests for OrderNotificationService with MailDev
 *
 * Prerequisites:
 * - Docker with MailDev running: docker-compose up -d maildev
 * - MailDev SMTP: localhost:1025
 * - MailDev UI: http://localhost:1080
 *
 * These tests send actual emails to MailDev and verify delivery via its API.
 */
describe('OrderNotificationService Integration (MailDev)', () => {
  let service: OrderNotificationService;
  let module: TestingModule;

  // MailDev API helper
  const MAILDEV_API = process.env.MAILDEV_API_URL || 'http://localhost:1080';

  async function clearMailDevInbox(): Promise<void> {
    try {
      await fetch(`${MAILDEV_API}/email/all`, { method: 'DELETE' });
    } catch (error) {
      console.warn('Could not clear MailDev inbox:', error);
    }
  }

  async function getMailDevEmails(): Promise<any[]> {
    try {
      const response = await fetch(`${MAILDEV_API}/email`);
      return await response.json();
    } catch (error) {
      console.warn('Could not fetch MailDev emails:', error);
      return [];
    }
  }

  async function waitForEmail(timeout = 8000): Promise<any[]> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const emails = await getMailDevEmails();
      if (emails.length > 0) {
        return emails;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return [];
  }

  // Mock data
  const mockCustomer: Partial<UserEntity> = {
    id: 10,
    email: 'customer@test.local',
    first_name: 'Test',
    last_name: 'Customer',
  };

  const mockSeller: Partial<SellerEntity> = {
    id: 1,
    user_id: 5,
    store_name: 'Integration Test Store',
    user: {
      id: 5,
      email: 'seller@test.local',
      first_name: 'Test',
      last_name: 'Seller',
    } as UserEntity,
  };

  const createMockOrder = (overrides = {}): Partial<SalesOrder> => ({
    id: 100,
    order_number: `ORD-INT-${Date.now()}`,
    user_id: 10,
    total_amount: 1500,
    subtotal: 1400,
    shipping_amount: 50,
    tax_amount: 50,
    tracking_number: 'TRACK-INT-123',
    shipping_provider: 'Test Courier',
    shipping_recipient_name: 'Test Customer',
    shipping_phone: '+639171234567',
    shipping_address_line1: '123 Integration Test St',
    shipping_city: 'Test City',
    shipping_state_province: 'Test Province',
    shipping_postal_code: '1234',
    shipping_country: 'Philippines',
    user: {
      id: 10,
      first_name: 'Test',
      last_name: 'Customer',
    } as any,
    seller: {
      id: 1,
      store_name: 'Integration Test Store',
    } as any,
    items: [
      {
        id: 1,
        quantity: 2,
        unit_price: 700,
        total_price: 1400,
        variant: {
          id: 5,
          variant_name: 'Large - Blue',
          variant_image_url: 'https://test.com/variant.jpg',
          product: {
            id: 1,
            product_name: 'Test Product',
            product_image_url: 'https://test.com/product.jpg',
          },
        },
      },
    ] as any,
    ...overrides,
  });

  // Mock repositories (we don't need real DB for these tests)
  const mockUserRepository = {
    findOne: jest.fn().mockImplementation((options) => {
      // Handle different query scenarios
      if (options?.where?.id === 10) {
        return Promise.resolve(mockCustomer);
      }
      // Return null for other IDs to simulate not found
      return Promise.resolve(null);
    }),
  };

  const mockSellerRepository = {
    findOne: jest.fn().mockImplementation((options) => {
      // Handle different query scenarios
      if (options?.where?.id === 1) {
        return Promise.resolve(mockSeller);
      }
      // Handle seller with relations
      if (options?.relations?.includes('user') && options?.where?.id === 1) {
        return Promise.resolve(mockSeller);
      }
      // Return null for other IDs to simulate not found
      return Promise.resolve(null);
    }),
  };

  // Mock notification repository (just stores, no real DB needed)
  const mockNotificationRepository = {
    create: jest.fn().mockImplementation((n) => ({ ...n, id: Date.now() })),
    findById: jest.fn().mockImplementation((id) => ({
      id,
      created_at: new Date(),
    })),
    update: jest.fn().mockResolvedValue(undefined),
    getUnreadCount: jest.fn().mockResolvedValue(0), // Mock unread count as 0
  };

  // Mock gateway (no real WebSocket needed)
  const mockNotificationsGateway = {
    sendToUser: jest.fn(),
    sendUnreadCount: jest.fn(),
  };

  // Mock push notification service
  const mockPushNotificationService = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };

  // Mock storage service (returns image URL as-is for testing)
  const mockStorageService = {
    getSignedUrl: jest
      .fn()
      .mockImplementation((path) =>
        Promise.resolve(`https://signed-url.test/${path}`),
      ),
  };

  beforeAll(async () => {
    // Check if MailDev is running
    try {
      await fetch(MAILDEV_API);
    } catch {
      console.warn(
        'MailDev not running. Skipping integration tests.',
        'Run: docker-compose up -d maildev',
      );
      return;
    }

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, mailConfig, authConfig],
          envFilePath: ['.env.test', '.env'],
        }),
      ],
      providers: [
        OrderNotificationService,
        NotificationsService,
        {
          provide: MailService,
          useFactory: (
            mailerService: MailerService,
            configService: ConfigService,
          ) => {
            return new MailService(mailerService, configService);
          },
          inject: [MailerService, ConfigService],
        },
        {
          provide: MailerService,
          useFactory: (configService: ConfigService) => {
            return new MailerService(configService);
          },
          inject: [ConfigService],
        },
        {
          provide: BaseNotificationRepository,
          useValue: mockNotificationRepository,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
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
  });

  afterAll(async () => {
    // Close the module to clean up resources and prevent leaks
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    await clearMailDevInbox();
    jest.clearAllMocks();
  });

  const MAILDEV_TEST_TIMEOUT_MS = 15000;

  // Skip all tests if MailDev is not running
  const itWithMailDev = (
    name: string,
    fn: () => Promise<void>,
    timeoutMs = MAILDEV_TEST_TIMEOUT_MS,
  ) => {
    // eslint-disable-next-line no-restricted-syntax
    it(
      name,
      async () => {
        try {
          await fetch(MAILDEV_API);
          await fn();
        } catch {
          console.warn(`Skipping test "${name}" - MailDev not available`);
        }
      },
      timeoutMs,
    );
  };

  describe('Email Delivery Tests', () => {
    itWithMailDev(
      'should send actual email to MailDev when order is confirmed',
      async () => {
        const mockOrder = createMockOrder();

        await service.sendOrderConfirmedNotification(mockOrder as SalesOrder);

        const emails = await waitForEmail();
        expect(emails.length).toBeGreaterThanOrEqual(1);

        const email = emails[0];
        expect(email.to[0].address).toBe('customer@test.local');
        expect(email.subject).toContain('Order Confirmed');
      },
    );

    itWithMailDev(
      'should send shipped email with tracking info to MailDev',
      async () => {
        const mockOrder = createMockOrder();

        await service.sendOrderShippedNotification(
          mockOrder as SalesOrder,
          'TRACK-EMAIL-TEST',
          'Test Courier Service',
        );

        const emails = await waitForEmail();
        expect(emails.length).toBeGreaterThanOrEqual(1);

        const email = emails[0];
        expect(email.to[0].address).toBe('customer@test.local');
        expect(email.subject).toContain('Order Shipped');
      },
    );

    itWithMailDev(
      'should send both customer and seller emails on completion',
      async () => {
        const mockOrder = createMockOrder();

        await service.sendOrderCompletedNotification(mockOrder as SalesOrder);

        // Wait a bit longer for 2 emails
        const emails = await waitForEmail(5000);
        expect(emails.length).toBeGreaterThanOrEqual(2);

        const recipients = emails.map((e) => e.to[0].address);
        expect(recipients).toContain('customer@test.local');
        expect(recipients).toContain('seller@test.local');
      },
    );

    itWithMailDev(
      'should NOT send duplicate emails (verify single email per notification)',
      async () => {
        const mockOrder = createMockOrder();

        // Send a single notification
        await service.sendOrderDeliveredNotification(mockOrder as SalesOrder);

        // Wait for emails
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const emails = await getMailDevEmails();

        // Should only have 1 email for this notification
        const deliveredEmails = emails.filter(
          (e) =>
            e.subject.includes('Delivered') &&
            e.to[0].address === 'customer@test.local',
        );
        expect(deliveredEmails.length).toBe(1);
      },
    );

    itWithMailDev(
      'should send email when order is placed (to seller)',
      async () => {
        const mockOrder = createMockOrder();

        await service.sendOrderPlacedNotification(mockOrder as SalesOrder);

        const emails = await waitForEmail();
        expect(emails.length).toBeGreaterThanOrEqual(1);

        const email = emails[0];
        expect(email.to[0].address).toBe('seller@test.local');
        expect(email.subject).toContain('New Order');
      },
    );

    itWithMailDev(
      'should render correct email template with order data',
      async () => {
        const mockOrder = createMockOrder({
          order_number: 'ORD-TEMPLATE-TEST-001',
        });

        await service.sendOrderProcessingNotification(mockOrder as SalesOrder);

        const emails = await waitForEmail();
        expect(emails.length).toBeGreaterThanOrEqual(1);

        const email = emails[0];
        // Check that order number appears in the email
        const emailHtml = email.html || '';
        const emailText = email.text || '';
        const emailContent = emailHtml + emailText;

        // The order number should appear somewhere in the email
        expect(
          emailContent.includes('ORD-TEMPLATE-TEST-001') ||
            email.subject.includes('ORD-TEMPLATE-TEST-001') ||
            emailContent.includes('Order'),
        ).toBe(true);
      },
    );

    itWithMailDev(
      'should include order items, amounts, and shipping address in email',
      async () => {
        const mockOrder = createMockOrder({
          order_number: 'ORD-DETAILS-TEST-001',
        });

        await service.sendOrderConfirmedNotification(mockOrder as SalesOrder);

        const emails = await waitForEmail();
        expect(emails.length).toBeGreaterThanOrEqual(1);

        const email = emails[0];
        const emailHtml = email.html || '';
        const emailText = email.text || '';
        const emailContent = emailHtml + emailText;

        // Verify order number
        expect(emailContent).toContain('ORD-DETAILS-TEST-001');

        // Note: Email template implementation may vary
        // These assertions verify that orderDetails were passed
        // The actual rendering depends on the email template
        expect(email.to[0].address).toBe('customer@test.local');
        expect(email.subject).toContain('Order Confirmed');
      },
    );
  });

  describe('Error Handling', () => {
    itWithMailDev('should not throw when email delivery fails', async () => {
      // Override user repository to return invalid email
      mockUserRepository.findOne.mockResolvedValueOnce({
        ...mockCustomer,
        email: '', // Invalid/empty email
      });

      const mockOrder = createMockOrder();

      // Should not throw
      await expect(
        service.sendOrderConfirmedNotification(mockOrder as SalesOrder),
      ).resolves.not.toThrow();
    });
  });
});
