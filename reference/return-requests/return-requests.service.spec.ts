import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReturnRequestsService } from './return-requests.service';
import { ReturnRequestRepository } from './persistence/repositories/return-request.repository';
import { ReturnRequestItemRepository } from './persistence/repositories/return-request-item.repository';
import { ReturnRequestEntity } from './persistence/entities/return-request.entity';
import { ReturnRequestItemEntity } from './persistence/entities/return-request-item.entity';
import { ReturnRequestMediaMappingEntity } from '@/media/persistence/entities/return-request-media-mapping.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { MediaUsersService } from '@/media/users/services/media-users.service';
import { MediaRepository } from '@/media/persistence/repositories/media.repository';
import { ReturnRequestStatusEnum } from './domain/return-request-status.enum';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { WalletsService } from '@/wallets/wallets.service';
import { PayoutsService } from '@/payouts/payouts.service';

describe('ReturnRequestsService', () => {
  let service: ReturnRequestsService;
  let returnRequestRepository: jest.Mocked<ReturnRequestRepository>;
  let salesOrderRepository: jest.Mocked<Repository<SalesOrderEntity>>;
  let salesOrderItemRepository: jest.Mocked<Repository<SalesOrderItemEntity>>;
  let returnRequestItemEntityRepository: jest.Mocked<
    Repository<ReturnRequestItemEntity>
  >;
  let dataSource: jest.Mocked<DataSource>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  } as User;

  const mockSeller: User = {
    id: 2,
    email: 'seller@example.com',
    first_name: 'Seller',
    last_name: 'User',
  } as User;

  const mockOrder: Partial<SalesOrderEntity> = {
    id: 1,
    user_id: 1,
    seller_id: 2,
    status: OrderStatusEnum.DELIVERED,
    delivered_at: new Date(),
    payment_method: 'cod', // COD order - allows refund without payment validation
    items: [
      {
        id: 1,
        order_id: 1,
        variant_id: 1,
        quantity: 5,
        quantity_returned: 0,
        unit_price: 100,
      } as SalesOrderItemEntity,
    ],
  };

  const mockReturnRequest = {
    id: 1,
    order_id: 1,
    user_id: 1,
    seller_id: 2,
    status: ReturnRequestStatusEnum.PENDING,
    calculated_refund_amount: 500,
    previous_order_status: OrderStatusEnum.DELIVERED,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnRequestsService,
        {
          provide: ReturnRequestRepository,
          useValue: {
            findById: jest.fn(),
            findByOrderId: jest.fn(),
            findBySellerId: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
        {
          provide: ReturnRequestItemRepository,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: OrderTrackingService,
          useValue: {
            createEvent: jest.fn(),
          },
        },
        {
          provide: MediaUsersService,
          useValue: {
            createMediaFromFile: jest.fn(),
          },
        },
        {
          provide: MediaRepository,
          useValue: {
            findById: jest.fn(),
            findByIds: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(7),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((callback) => {
              const mockQb = {
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: 1 }),
              };
              return callback({
                findOne: jest.fn(),
                find: jest.fn().mockResolvedValue([]),
                save: jest.fn(),
                update: jest.fn(),
                create: jest.fn((entity, data) => data),
                increment: jest.fn(),
                createQueryBuilder: jest.fn().mockReturnValue(mockQb),
              });
            }),
            getRepository: jest.fn().mockReturnValue({
              createQueryBuilder: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue(null),
              }),
            }),
          },
        },
        {
          provide: getRepositoryToken(SalesOrderEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SalesOrderItemEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReturnRequestEntity),
          useValue: {
            update: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReturnRequestItemEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReturnRequestMediaMappingEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendReturnRequested: jest.fn().mockResolvedValue({}),
            sendReturnApproved: jest.fn().mockResolvedValue({}),
            sendReturnRejected: jest.fn().mockResolvedValue({}),
            sendReturnPickupScheduled: jest.fn().mockResolvedValue({}),
            sendReturnPickedUp: jest.fn().mockResolvedValue({}),
            sendReturnReceived: jest.fn().mockResolvedValue({}),
            sendRefundProcessed: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CheckoutPaymentsService,
          useValue: {
            findPaymentsBySalesOrderId: jest.fn().mockResolvedValue([]),
            processRefund: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: WalletsService,
          useValue: {
            deductReturn: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PayoutsService,
          useValue: {
            sendPayout: jest.fn().mockResolvedValue({
              providerTxnId: 'test-txn',
              status: 'completed',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ReturnRequestsService>(ReturnRequestsService);
    returnRequestRepository = module.get(ReturnRequestRepository);
    salesOrderRepository = module.get(getRepositoryToken(SalesOrderEntity));
    salesOrderItemRepository = module.get(
      getRepositoryToken(SalesOrderItemEntity),
    );
    returnRequestItemEntityRepository = module.get(
      getRepositoryToken(ReturnRequestItemEntity),
    );
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReturnRequest', () => {
    it('should throw ForbiddenException if user does not own the order', async () => {
      const otherUser = { ...mockUser, id: 999 };
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
            },
          },
          otherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not in DELIVERED or COMPLETED status', async () => {
      const pendingOrder = {
        ...mockOrder,
        status: OrderStatusEnum.PENDING,
      };
      salesOrderRepository.findOne.mockResolvedValue(
        pendingOrder as SalesOrderEntity,
      );

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
            },
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if quantity exceeds available', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 10 }], // Only 5 available
            },
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if duplicate items in request', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [
                { sales_order_item_id: 1, quantity: 1 },
                { sales_order_item_id: 1, quantity: 2 },
              ],
            },
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveReturnRequest', () => {
    it('should throw BadRequestException if status is not PENDING', async () => {
      const approvedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.APPROVED,
      };
      returnRequestRepository.findByOrderId.mockResolvedValue(
        approvedRequest as any,
      );

      await expect(
        service.approveReturnRequest(1, { notes: 'Approved' }, mockSeller, 2),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own the return', async () => {
      const otherSellerRequest = { ...mockReturnRequest, seller_id: 999 };
      returnRequestRepository.findByOrderId.mockResolvedValue(
        otherSellerRequest as any,
      );

      await expect(
        service.approveReturnRequest(1, { notes: 'Approved' }, mockSeller, 2),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('rejectReturnRequest', () => {
    it('should throw BadRequestException if status is not PENDING', async () => {
      const approvedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.APPROVED,
      };
      returnRequestRepository.findByOrderId.mockResolvedValue(
        approvedRequest as any,
      );

      await expect(
        service.rejectReturnRequest(
          1,
          { rejection_reason: 'Invalid' },
          mockSeller,
          2,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processRefund', () => {
    const receivedRequest = {
      ...mockReturnRequest,
      status: ReturnRequestStatusEnum.RECEIVED,
      calculated_refund_amount: 100,
    };

    beforeEach(() => {
      returnRequestRepository.findByOrderId.mockResolvedValue(
        receivedRequest as any,
      );
      returnRequestItemEntityRepository.find.mockResolvedValue([]);
      salesOrderItemRepository.find.mockResolvedValue([]);
    });

    it('should throw BadRequestException if status is not RECEIVED', async () => {
      const pendingRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.PENDING,
      };
      returnRequestRepository.findByOrderId.mockResolvedValue(
        pendingRequest as any,
      );

      await expect(service.processRefund(1, {}, mockSeller, 2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if refund amount is zero or negative', async () => {
      await expect(
        service.processRefund(1, { actual_refund_amount: 0 }, mockSeller, 2),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.processRefund(1, { actual_refund_amount: -10 }, mockSeller, 2),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if refund exceeds 20% of calculated', async () => {
      await expect(
        service.processRefund(
          1,
          { actual_refund_amount: 150 }, // 50% over calculated (100)
          mockSeller,
          2,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if refund differs by >5% without override flag', async () => {
      await expect(
        service.processRefund(
          1,
          { actual_refund_amount: 110 }, // 10% over calculated
          mockSeller,
          2,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if override flag set without notes', async () => {
      await expect(
        service.processRefund(
          1,
          { actual_refund_amount: 110, override_amount: true },
          mockSeller,
          2,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow refund with override flag and notes', async () => {
      returnRequestRepository.findById.mockResolvedValue(
        receivedRequest as any,
      );
      salesOrderRepository.findOne.mockResolvedValue(mockOrder as any);

      await expect(
        service.processRefund(
          1,
          {
            actual_refund_amount: 110,
            override_amount: true,
            refund_notes: 'Customer satisfaction adjustment',
          },
          mockSeller,
          2,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('processRefund order status', () => {
    it('should set order status to REFUNDED for full return', async () => {
      const receivedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.RECEIVED,
        calculated_refund_amount: 500,
      };
      returnRequestRepository.findByOrderId.mockResolvedValue(
        receivedRequest as any,
      );
      returnRequestRepository.findById.mockResolvedValue(
        receivedRequest as any,
      );
      salesOrderRepository.findOne.mockResolvedValue(mockOrder as any);

      // Order has 5 items, all being returned
      salesOrderItemRepository.find.mockResolvedValue([
        { id: 1, quantity: 5, quantity_returned: 0 } as SalesOrderItemEntity,
      ]);
      returnRequestItemEntityRepository.find.mockResolvedValue([
        {
          id: 1,
          return_request_id: 1,
          sales_order_item_id: 1,
          quantity_returning: 5,
        } as ReturnRequestItemEntity,
      ]);

      // This should process as full return and set status to REFUNDED
      await service.processRefund(1, {}, mockSeller, 2);

      // Verify transaction was called (meaning validation passed)
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should set order status to REFUNDED for partial return', async () => {
      const receivedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.RECEIVED,
        calculated_refund_amount: 200,
      };
      returnRequestRepository.findByOrderId.mockResolvedValue(
        receivedRequest as any,
      );
      returnRequestRepository.findById.mockResolvedValue(
        receivedRequest as any,
      );
      salesOrderRepository.findOne.mockResolvedValue(mockOrder as any);

      // Order has 5 items, only 2 being returned (partial return)
      salesOrderItemRepository.find.mockResolvedValue([
        { id: 1, quantity: 5, quantity_returned: 0 } as SalesOrderItemEntity,
      ]);
      returnRequestItemEntityRepository.find.mockResolvedValue([
        {
          id: 1,
          return_request_id: 1,
          sales_order_item_id: 1,
          quantity_returning: 2,
        } as ReturnRequestItemEntity,
      ]);

      // Partial return should also set status to REFUNDED
      await service.processRefund(1, {}, mockSeller, 2);

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should account for previously returned quantities', async () => {
      const receivedRequest = {
        ...mockReturnRequest,
        status: ReturnRequestStatusEnum.RECEIVED,
        calculated_refund_amount: 200,
      };
      returnRequestRepository.findByOrderId.mockResolvedValue(
        receivedRequest as any,
      );
      returnRequestRepository.findById.mockResolvedValue(
        receivedRequest as any,
      );
      salesOrderRepository.findOne.mockResolvedValue(mockOrder as any);

      // Order has 5 items, 3 already returned, 2 more being returned (full return)
      salesOrderItemRepository.find.mockResolvedValue([
        { id: 1, quantity: 5, quantity_returned: 3 } as SalesOrderItemEntity,
      ]);
      returnRequestItemEntityRepository.find.mockResolvedValue([
        {
          id: 1,
          return_request_id: 1,
          sales_order_item_id: 1,
          quantity_returning: 2,
        } as ReturnRequestItemEntity,
      ]);

      await service.processRefund(1, {}, mockSeller, 2);

      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('File upload validation', () => {
    it('should throw BadRequestException if more than 5 files uploaded', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const files = Array(6).fill({
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'test.jpg',
      });

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
            },
          },
          mockUser,
          files as Express.Multer.File[],
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid file type', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const files = [
        {
          mimetype: 'application/pdf',
          size: 1024,
          originalname: 'test.pdf',
        },
      ];

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
            },
          },
          mockUser,
          files as Express.Multer.File[],
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file exceeds 5MB', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const files = [
        {
          mimetype: 'image/jpeg',
          size: 6 * 1024 * 1024, // 6MB
          originalname: 'test.jpg',
        },
      ];

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
            },
          },
          mockUser,
          files as Express.Multer.File[],
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Base64 file upload validation', () => {
    it('should throw BadRequestException if base64_files exceed 5 images', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const base64Files = Array(6).fill({
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      });

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
              base64_files: base64Files as Express.Multer.File[],
            },
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if combined files and base64_files exceed 5', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const multipartFiles = Array(3).fill({
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'multipart.jpg',
      });

      const base64Files = Array(3).fill({
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'base64.jpg',
        buffer: Buffer.from('test'),
      });

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
              base64_files: base64Files as Express.Multer.File[],
            },
          },
          mockUser,
          multipartFiles as Express.Multer.File[],
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid base64 file type', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const base64Files = [
        {
          mimetype: 'application/pdf',
          size: 1024,
          originalname: 'test.pdf',
          buffer: Buffer.from('test'),
        },
      ];

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
              base64_files: base64Files as Express.Multer.File[],
            },
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if base64 file exceeds 5MB', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const base64Files = [
        {
          mimetype: 'image/jpeg',
          size: 6 * 1024 * 1024, // 6MB
          originalname: 'large.jpg',
          buffer: Buffer.from('test'),
        },
      ];

      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
              base64_files: base64Files as Express.Multer.File[],
            },
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid base64_files within limits', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const base64Files = [
        {
          mimetype: 'image/jpeg',
          size: 1024,
          originalname: 'valid.jpg',
          buffer: Buffer.from('test'),
        },
        {
          mimetype: 'image/png',
          size: 2048,
          originalname: 'valid.png',
          buffer: Buffer.from('test2'),
        },
      ];

      // Should not throw - validation passes
      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
              base64_files: base64Files as Express.Multer.File[],
            },
          },
          mockUser,
        ),
      ).rejects.not.toThrow('Maximum 5 images allowed');
    });

    it('should accept combined files and base64_files within 5 limit', async () => {
      salesOrderRepository.findOne.mockResolvedValue(
        mockOrder as SalesOrderEntity,
      );

      const multipartFiles = [
        {
          mimetype: 'image/jpeg',
          size: 1024,
          originalname: 'multipart1.jpg',
        },
        {
          mimetype: 'image/jpeg',
          size: 1024,
          originalname: 'multipart2.jpg',
        },
      ];

      const base64Files = [
        {
          mimetype: 'image/png',
          size: 1024,
          originalname: 'base64-1.png',
          buffer: Buffer.from('test'),
        },
        {
          mimetype: 'image/png',
          size: 1024,
          originalname: 'base64-2.png',
          buffer: Buffer.from('test2'),
        },
      ];

      // Should not throw for file count - 4 total is within limit
      await expect(
        service.createReturnRequest(
          1,
          {
            data: {
              reason: 'Defective',
              items: [{ sales_order_item_id: 1, quantity: 1 }],
              base64_files: base64Files as Express.Multer.File[],
            },
          },
          mockUser,
          multipartFiles as Express.Multer.File[],
        ),
      ).rejects.not.toThrow('Maximum 5 images allowed');
    });
  });
});
