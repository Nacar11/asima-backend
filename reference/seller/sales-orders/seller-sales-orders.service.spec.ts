import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerSalesOrdersService } from './seller-sales-orders.service';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { User } from '@/users/domain/user';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { NotificationsService } from '@/notifications/notifications.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { WalletsService } from '@/wallets/wallets.service';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';

describe('SellerSalesOrdersService', () => {
  let service: SellerSalesOrdersService;
  let orderRepository: jest.Mocked<Repository<SalesOrderEntity>>;
  let orderItemRepository: jest.Mocked<Repository<SalesOrderItemEntity>>;
  let inventoryStocksService: jest.Mocked<InventoryStocksService>;

  const mockSellerUser: User = {
    id: 1,
    first_name: 'Seller',
    last_name: 'User',
    email: 'seller@example.com',
    system_admin: false,
    seller_id: 1,
  } as User;

  const mockAdminUser: User = {
    id: 2,
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    system_admin: true,
  } as User;

  const mockRegularUser: User = {
    id: 3,
    first_name: 'Regular',
    last_name: 'User',
    email: 'regular@example.com',
    system_admin: false,
  } as User;

  const mockOtherSellerUser: User = {
    id: 4,
    first_name: 'Other',
    last_name: 'Seller',
    email: 'other@example.com',
    system_admin: false,
    seller_id: 2,
  } as User;

  const mockOrderEntity: Partial<SalesOrderEntity> = {
    id: 1,
    user_id: 10,
    seller_id: 1,
    order_number: 'ORD-TEST-1234',
    status: OrderStatusEnum.PENDING,
    payment_method: 'cod',
    subtotal: 350,
    tax_amount: 0,
    shipping_amount: 0,
    total_amount: 350,
    notes: null,
    shipping_address: null,
    tracking_number: null,
    shipping_provider: null,
    shipped_at: null,
    delivered_at: null,
    cancellation_reason: null,
    cancelled_at: null,
    items: [
      {
        id: 1,
        order_id: 1,
        variant_id: 1,
        quantity: 2,
        unit_price: 100,
        total_price: 200,
        item_type: CartItemTypeEnum.PRODUCT,
      } as SalesOrderItemEntity,
      {
        id: 2,
        order_id: 1,
        variant_id: 2,
        quantity: 1,
        unit_price: 150,
        total_price: 150,
        item_type: CartItemTypeEnum.PRODUCT,
      } as SalesOrderItemEntity,
    ],
    user: {
      id: 10,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    } as any,
    seller: {
      id: 1,
      store_name: 'Test Store',
    } as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createMockQueryBuilder = (result: any[] = [], total: number = 0) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([result, total]),
  });

  beforeEach(async () => {
    const mockOrderRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockOrderItemRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockSellerRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        store_name: 'Test Store',
      }),
    };

    const mockInventoryStocksService = {
      releaseStock: jest.fn(),
      fulfillStock: jest.fn(),
    };

    const mockOrderTrackingService = {
      createEvent: jest.fn(),
      getEventsByOrderId: jest.fn(),
      getLatestEventByOrderId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerSalesOrdersService,
        {
          provide: getRepositoryToken(SalesOrderEntity),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(SalesOrderItemEntity),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(SellerEntity),
          useValue: mockSellerRepository,
        },
        {
          provide: InventoryStocksService,
          useValue: mockInventoryStocksService,
        },
        {
          provide: OrderTrackingService,
          useValue: mockOrderTrackingService,
        },
        {
          provide: NotificationsService,
          useValue: {
            sendOrderConfirmed: jest.fn().mockResolvedValue({}),
            sendOrderProcessing: jest.fn().mockResolvedValue({}),
            sendOrderReadyToShip: jest.fn().mockResolvedValue({}),
            sendOrderShipped: jest.fn().mockResolvedValue({}),
            sendOrderOutForDelivery: jest.fn().mockResolvedValue({}),
            sendOrderDelivered: jest.fn().mockResolvedValue({}),
            sendOrderCancelled: jest.fn().mockResolvedValue({}),
            sendRefundProcessed: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 10,
              email: 'customer@example.com',
              first_name: 'Customer',
              last_name: 'Name',
            }),
          },
        },
        {
          provide: CheckoutPaymentsService,
          useValue: {
            findPaymentsBySalesOrderId: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(SalesOrderVoucherEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(UserVoucherEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: WalletsService,
          useValue: {
            confirmEarning: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SellerSalesOrdersService>(SellerSalesOrdersService);
    orderRepository = module.get(getRepositoryToken(SalesOrderEntity));
    orderItemRepository = module.get(getRepositoryToken(SalesOrderItemEntity));
    inventoryStocksService = module.get(InventoryStocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(() => {
      orderRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([mockOrderEntity], 1) as any,
      );
    });

    it('should return paginated orders with skip/take pagination', async () => {
      const result = await service.findAll({}, mockSellerUser.seller_id);

      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
    });

    it('should return paginated orders without seller filter when sellerId is null', async () => {
      const result = await service.findAll({}, null);

      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('should apply status filter', async () => {
      const qb = createMockQueryBuilder([mockOrderEntity], 1);
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll(
        { status: OrderStatusEnum.PENDING },
        mockSellerUser.seller_id,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('order.status = :status', {
        status: OrderStatusEnum.PENDING,
      });
    });

    it('should apply date filters', async () => {
      const qb = createMockQueryBuilder([mockOrderEntity], 1);
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll(
        { date_from: '2025-01-01', date_to: '2025-12-31' },
        mockSellerUser.seller_id,
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        'order.created_at >= :date_from',
        { date_from: '2025-01-01' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('order.created_at <= :date_to', {
        date_to: '2025-12-31',
      });
    });

    it('should filter by sellerId when provided', async () => {
      const qb = createMockQueryBuilder([mockOrderEntity], 1);
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll({}, 5);

      expect(qb.andWhere).toHaveBeenCalledWith('order.seller_id = :sellerId', {
        sellerId: 5,
      });
    });

    it('should apply order_number filter', async () => {
      const qb = createMockQueryBuilder([mockOrderEntity], 1);
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll(
        { order_number: 'ORD-123' },
        mockSellerUser.seller_id,
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        'order.order_number ILIKE :orderNumber',
        { orderNumber: '%ORD-123%' },
      );
    });
  });

  describe('findById', () => {
    it('should return order for seller who owns it', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrderEntity as any);

      const result = await service.findById(1, mockSellerUser);

      expect(result.id).toBe(1);
      expect(result.order_number).toBe('ORD-TEST-1234');
    });

    it('should return order for admin', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrderEntity as any);

      const result = await service.findById(1, mockAdminUser);

      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(999, mockSellerUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for regular user', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrderEntity as any);

      await expect(service.findById(1, mockRegularUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrderEntity as any);

      await expect(service.findById(1, mockOtherSellerUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateOrder', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        items: [...mockOrderEntity.items!],
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
    });

    it('should update order notes', async () => {
      const result = await service.updateOrder(
        1,
        { notes: 'Updated notes' },
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update shipping address', async () => {
      await service.updateOrder(
        1,
        { shipping_address: '123 Main St' },
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ shipping_address: '123 Main St' }),
      );
    });

    it('should update order items', async () => {
      orderItemRepository.findOne.mockResolvedValue({
        id: 1,
        order_id: 1,
        variant_id: 1,
        quantity: 2,
        unit_price: 100,
        total_price: 200,
      } as any);
      orderItemRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );

      await service.updateOrder(
        1,
        { items: [{ id: 1, quantity: 5 }] },
        mockSellerUser,
      );

      expect(orderItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateOrder(1, { notes: 'test' }, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if order item not found', async () => {
      orderItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateOrder(
          1,
          { items: [{ id: 999, quantity: 5 }] },
          mockSellerUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.updateOrder(1, { notes: 'test' }, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.updateOrder(1, { notes: 'test' }, mockOtherSellerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('confirmOrder', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PENDING,
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
    });

    it('should confirm pending order for seller', async () => {
      const result = await service.confirmOrder(1, undefined, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.CONFIRMED }),
      );
      expect(result).toBeDefined();
    });

    it('should confirm pending order for admin', async () => {
      const result = await service.confirmOrder(1, undefined, mockAdminUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.CONFIRMED }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmOrder(999, undefined, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.confirmOrder(1, undefined, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not pending', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.CONFIRMED,
      } as any);

      await expect(
        service.confirmOrder(1, undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.confirmOrder(1, undefined, mockOtherSellerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('startProcessing', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.CONFIRMED,
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
    });

    it('should start processing confirmed order for seller', async () => {
      const result = await service.startProcessing(
        1,
        undefined,
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.PROCESSING }),
      );
      expect(result).toBeDefined();
    });

    it('should start processing confirmed order for admin', async () => {
      const result = await service.startProcessing(1, undefined, mockAdminUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.PROCESSING }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.startProcessing(999, undefined, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.startProcessing(1, undefined, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not confirmed', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PENDING,
      } as any);

      await expect(
        service.startProcessing(1, undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.startProcessing(1, undefined, mockOtherSellerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('shipOrder', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.READY_TO_SHIP,
        items: [...mockOrderEntity.items!],
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
      inventoryStocksService.fulfillStock.mockResolvedValue(undefined as any);
    });

    it('should ship ready_to_ship order for seller', async () => {
      const result = await service.shipOrder(
        1,
        { tracking_number: 'TRK123', shipping_provider: 'FedEx' },
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatusEnum.SHIPPED,
          tracking_number: 'TRK123',
          shipping_provider: 'FedEx',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should ship ready_to_ship order for admin', async () => {
      const result = await service.shipOrder(
        1,
        { tracking_number: 'TRK123', shipping_provider: 'UPS' },
        mockAdminUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.SHIPPED }),
      );
      expect(result).toBeDefined();
    });

    it('should set shipped_at timestamp', async () => {
      await service.shipOrder(
        1,
        { tracking_number: 'TRK123', shipping_provider: 'FedEx' },
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shipped_at: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.shipOrder(
          999,
          { tracking_number: 'TRK123', shipping_provider: 'FedEx' },
          mockSellerUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.shipOrder(
          1,
          { tracking_number: 'TRK123', shipping_provider: 'FedEx' },
          mockRegularUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not ready_to_ship', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PROCESSING,
        items: [...mockOrderEntity.items!],
      } as any);

      await expect(
        service.shipOrder(
          1,
          { tracking_number: 'TRK123', shipping_provider: 'FedEx' },
          mockSellerUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.shipOrder(
          1,
          { tracking_number: 'TRK123', shipping_provider: 'FedEx' },
          mockOtherSellerUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fulfill stock for all items at ship time', async () => {
      await service.shipOrder(
        1,
        { tracking_number: 'TRK123', shipping_provider: 'FedEx' },
        mockSellerUser,
      );

      expect(inventoryStocksService.fulfillStock).toHaveBeenCalledTimes(2);
      expect(inventoryStocksService.fulfillStock).toHaveBeenCalledWith(
        1,
        2,
        mockSellerUser,
      );
      expect(inventoryStocksService.fulfillStock).toHaveBeenCalledWith(
        2,
        1,
        mockSellerUser,
      );
    });

    it('should auto-generate tracking number if not provided', async () => {
      const result = await service.shipOrder(1, {}, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatusEnum.SHIPPED,
          tracking_number: expect.stringMatching(/^INH-\d+-\d+$/),
          shipping_provider: 'In-House Delivery',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should use provided tracking number when given', async () => {
      const result = await service.shipOrder(
        1,
        { tracking_number: 'CUSTOM-123' },
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tracking_number: 'CUSTOM-123',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should use provided shipping provider when given', async () => {
      const result = await service.shipOrder(
        1,
        { shipping_provider: 'Custom Courier' },
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shipping_provider: 'Custom Courier',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('readyToShip', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PROCESSING,
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
    });

    it('should mark processing order as ready to ship for seller', async () => {
      const result = await service.readyToShip(1, undefined, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.READY_TO_SHIP }),
      );
      expect(result).toBeDefined();
    });

    it('should mark processing order as ready to ship for admin', async () => {
      const result = await service.readyToShip(1, undefined, mockAdminUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.READY_TO_SHIP }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.readyToShip(999, undefined, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.readyToShip(1, undefined, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not processing', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.CONFIRMED,
      } as any);

      await expect(
        service.readyToShip(1, undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.readyToShip(1, undefined, mockOtherSellerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('outForDelivery', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.SHIPPED,
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
    });

    it('should mark shipped order as out for delivery for seller', async () => {
      const result = await service.outForDelivery(1, undefined, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.OUT_FOR_DELIVERY }),
      );
      expect(result).toBeDefined();
    });

    it('should mark shipped order as out for delivery for admin', async () => {
      const result = await service.outForDelivery(1, undefined, mockAdminUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.OUT_FOR_DELIVERY }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.outForDelivery(999, undefined, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.outForDelivery(1, undefined, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not shipped', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PROCESSING,
      } as any);

      await expect(
        service.outForDelivery(1, undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.outForDelivery(1, undefined, mockOtherSellerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deliverOrder', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.SHIPPED,
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
    });

    it('should deliver shipped order for seller', async () => {
      const result = await service.deliverOrder(1, undefined, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.DELIVERED }),
      );
      expect(result).toBeDefined();
    });

    it('should deliver out_for_delivery order for seller', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.OUT_FOR_DELIVERY,
      } as any);

      const result = await service.deliverOrder(1, undefined, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.DELIVERED }),
      );
      expect(result).toBeDefined();
    });

    it('should deliver shipped order for admin', async () => {
      const result = await service.deliverOrder(1, undefined, mockAdminUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.DELIVERED }),
      );
      expect(result).toBeDefined();
    });

    it('should set delivered_at timestamp', async () => {
      await service.deliverOrder(1, undefined, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          delivered_at: expect.any(Date),
        }),
      );
    });

    it('should NOT fulfill stock (stock already deducted at ship time)', async () => {
      await service.deliverOrder(1, undefined, mockSellerUser);

      // Stock deduction happens at SHIP time, not DELIVER time
      expect(inventoryStocksService.fulfillStock).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deliverOrder(999, undefined, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.deliverOrder(1, undefined, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not shipped or out_for_delivery', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PROCESSING,
      } as any);

      await expect(
        service.deliverOrder(1, undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.deliverOrder(1, undefined, mockOtherSellerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refundOrder', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.RETURNED,
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
    });

    it('should refund returned order for seller', async () => {
      const result = await service.refundOrder(1, undefined, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.REFUNDED }),
      );
      expect(result).toBeDefined();
    });

    it('should refund returned order for admin', async () => {
      const result = await service.refundOrder(1, undefined, mockAdminUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.REFUNDED }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refundOrder(999, undefined, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.refundOrder(1, undefined, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not returned', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.DELIVERED,
      } as any);

      await expect(
        service.refundOrder(1, undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.refundOrder(1, undefined, mockOtherSellerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelOrder', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PENDING,
        items: [...mockOrderEntity.items!],
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
      inventoryStocksService.releaseStock.mockResolvedValue(undefined as any);
    });

    it('should cancel pending order for seller', async () => {
      const result = await service.cancelOrder(
        1,
        'Customer request',
        undefined,
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatusEnum.CANCELLED,
          cancellation_reason: 'Customer request',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should cancel confirmed order for seller', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.CONFIRMED,
        items: [...mockOrderEntity.items!],
      } as any);

      const result = await service.cancelOrder(
        1,
        'Out of stock',
        undefined,
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.CANCELLED }),
      );
      expect(result).toBeDefined();
    });

    it('should cancel order for admin', async () => {
      const result = await service.cancelOrder(
        1,
        'Admin cancellation',
        undefined,
        mockAdminUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.CANCELLED }),
      );
      expect(result).toBeDefined();
    });

    it('should set cancelled_at timestamp', async () => {
      await service.cancelOrder(1, 'reason', undefined, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelled_at: expect.any(Date),
        }),
      );
    });

    it('should release stock for all items', async () => {
      await service.cancelOrder(1, 'reason', undefined, mockSellerUser);

      expect(inventoryStocksService.releaseStock).toHaveBeenCalledTimes(2);
      expect(inventoryStocksService.releaseStock).toHaveBeenCalledWith(
        1,
        2,
        mockSellerUser,
      );
      expect(inventoryStocksService.releaseStock).toHaveBeenCalledWith(
        2,
        1,
        mockSellerUser,
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelOrder(999, 'reason', undefined, mockSellerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(
        service.cancelOrder(1, 'reason', undefined, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should cancel processing order for seller', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PROCESSING,
        items: [...mockOrderEntity.items!],
      } as any);

      const result = await service.cancelOrder(
        1,
        'reason',
        undefined,
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.CANCELLED }),
      );
      expect(result).toBeDefined();
    });

    it('should cancel ready_to_ship order for seller', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.READY_TO_SHIP,
        items: [...mockOrderEntity.items!],
      } as any);

      const result = await service.cancelOrder(
        1,
        'reason',
        undefined,
        mockSellerUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatusEnum.CANCELLED }),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if order is shipped', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.SHIPPED,
        items: [...mockOrderEntity.items!],
      } as any);

      await expect(
        service.cancelOrder(1, 'reason', undefined, mockSellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(
        service.cancelOrder(1, 'reason', undefined, mockOtherSellerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteOrder', () => {
    beforeEach(() => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.PENDING,
        items: [...mockOrderEntity.items!],
      } as any);
      orderRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );
      inventoryStocksService.releaseStock.mockResolvedValue(undefined as any);
    });

    it('should soft delete order for seller', async () => {
      await service.deleteOrder(1, mockSellerUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(Date),
        }),
      );
    });

    it('should soft delete order for admin', async () => {
      await service.deleteOrder(1, mockAdminUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(Date),
        }),
      );
    });

    it('should release stock for pending orders', async () => {
      await service.deleteOrder(1, mockSellerUser);

      expect(inventoryStocksService.releaseStock).toHaveBeenCalledTimes(2);
    });

    it('should release stock for confirmed orders', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.CONFIRMED,
        items: [...mockOrderEntity.items!],
      } as any);

      await service.deleteOrder(1, mockSellerUser);

      expect(inventoryStocksService.releaseStock).toHaveBeenCalledTimes(2);
    });

    it('should NOT release stock for shipped orders', async () => {
      orderRepository.findOne.mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatusEnum.SHIPPED,
        items: [...mockOrderEntity.items!],
      } as any);

      await service.deleteOrder(1, mockSellerUser);

      expect(inventoryStocksService.releaseStock).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteOrder(999, mockSellerUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for regular user', async () => {
      await expect(service.deleteOrder(1, mockRegularUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if seller does not own order', async () => {
      await expect(service.deleteOrder(1, mockOtherSellerUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
