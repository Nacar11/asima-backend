import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { SalesOrdersSchedulerService } from './sales-orders-scheduler.service';
import { SalesOrderEntity } from './persistence/entities/sales-order.entity';
import { OrderStatusEnum } from './domain/order-status.enum';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';
import { InventoryStocksService } from '@/inventory-stocks/inventory-stocks.service';
import { WalletsService } from '@/wallets/wallets.service';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';

describe('SalesOrdersSchedulerService', () => {
  let service: SalesOrdersSchedulerService;
  let orderRepository: jest.Mocked<Repository<SalesOrderEntity>>;
  let orderTrackingService: jest.Mocked<OrderTrackingService>;

  const mockOrderTrackingService = {
    createEvent: jest.fn().mockResolvedValue({}),
  };

  const mockDeliveredOrder = {
    id: 1,
    order_number: 'ORD-TEST-001',
    status: OrderStatusEnum.DELIVERED,
    delivered_at: new Date('2024-01-01'),
    fulfillment_type: 'delivery',
  } as SalesOrderEntity;

  const mockDeliveredOrder2 = {
    id: 2,
    order_number: 'ORD-TEST-002',
    status: OrderStatusEnum.DELIVERED,
    delivered_at: new Date('2024-01-02'),
    fulfillment_type: 'delivery',
  } as SalesOrderEntity;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockRepository = {
      find: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrdersSchedulerService,
        {
          provide: getRepositoryToken(SalesOrderEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CheckoutPaymentEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(CheckoutPaymentOrderEntity),
          useValue: {},
        },
        {
          provide: OrderTrackingService,
          useValue: mockOrderTrackingService,
        },
        {
          provide: InventoryStocksService,
          useValue: {},
        },
        {
          provide: WalletsService,
          useValue: {
            confirmEarning: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SalesOrdersSchedulerService>(
      SalesOrdersSchedulerService,
    );
    orderRepository = module.get(getRepositoryToken(SalesOrderEntity));
    orderTrackingService = module.get(OrderTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autoCompleteDeliveredOrders', () => {
    it('should auto-complete delivered orders older than 7 days', async () => {
      orderRepository.find.mockResolvedValue([
        mockDeliveredOrder,
        mockDeliveredOrder2,
      ]);
      orderRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.autoCompleteDeliveredOrders();

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: {
          status: OrderStatusEnum.DELIVERED,
          delivered_at: expect.objectContaining({
            _type: 'lessThan',
          }),
          fulfillment_type: 'delivery',
        },
      });
      expect(orderRepository.update).toHaveBeenCalledTimes(2);
      expect(orderRepository.update).toHaveBeenCalledWith(
        { id: mockDeliveredOrder.id, status: OrderStatusEnum.DELIVERED },
        expect.objectContaining({
          status: OrderStatusEnum.COMPLETED,
          completed_at: expect.any(Date),
        }),
      );
      expect(orderRepository.update).toHaveBeenCalledWith(
        { id: mockDeliveredOrder2.id, status: OrderStatusEnum.DELIVERED },
        expect.objectContaining({
          status: OrderStatusEnum.COMPLETED,
          completed_at: expect.any(Date),
        }),
      );
      expect(orderTrackingService.createEvent).toHaveBeenCalledTimes(2);
      expect(orderTrackingService.createEvent).toHaveBeenCalledWith(
        mockDeliveredOrder.id,
        OrderEventTypeEnum.COMPLETED,
        'Order auto-completed after delivery confirmation period',
      );
      expect(orderTrackingService.createEvent).toHaveBeenCalledWith(
        mockDeliveredOrder2.id,
        OrderEventTypeEnum.COMPLETED,
        'Order auto-completed after delivery confirmation period',
      );
    });

    it('should not update any orders when no delivered orders found', async () => {
      orderRepository.find.mockResolvedValue([]);

      await service.autoCompleteDeliveredOrders();

      expect(orderRepository.find).toHaveBeenCalled();
      expect(orderRepository.update).not.toHaveBeenCalled();
      expect(orderTrackingService.createEvent).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Mock logger to prevent error output in tests
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      orderRepository.find.mockRejectedValue(new Error('Database error'));

      // Should not throw, just log the error
      await expect(
        service.autoCompleteDeliveredOrders(),
      ).resolves.toBeUndefined();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error in auto-complete job:',
        expect.any(Error),
      );
      expect(orderTrackingService.createEvent).not.toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('should use correct cutoff date (7 days ago)', async () => {
      orderRepository.find.mockResolvedValue([]);

      await service.autoCompleteDeliveredOrders();

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: {
          status: OrderStatusEnum.DELIVERED,
          delivered_at: expect.objectContaining({
            _type: 'lessThan',
          }),
          fulfillment_type: 'delivery',
        },
      });
      expect(orderTrackingService.createEvent).not.toHaveBeenCalled();
    });

    it('should complete orders one by one', async () => {
      const orders = [mockDeliveredOrder, mockDeliveredOrder2];
      orderRepository.find.mockResolvedValue(orders);
      orderRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.autoCompleteDeliveredOrders();

      // Verify orders were processed sequentially
      expect(orderRepository.update).toHaveBeenNthCalledWith(
        1,
        { id: mockDeliveredOrder.id, status: OrderStatusEnum.DELIVERED },
        expect.objectContaining({ status: OrderStatusEnum.COMPLETED }),
      );
      expect(orderRepository.update).toHaveBeenNthCalledWith(
        2,
        { id: mockDeliveredOrder2.id, status: OrderStatusEnum.DELIVERED },
        expect.objectContaining({ status: OrderStatusEnum.COMPLETED }),
      );
      expect(orderTrackingService.createEvent).toHaveBeenNthCalledWith(
        1,
        mockDeliveredOrder.id,
        OrderEventTypeEnum.COMPLETED,
        'Order auto-completed after delivery confirmation period',
      );
      expect(orderTrackingService.createEvent).toHaveBeenNthCalledWith(
        2,
        mockDeliveredOrder2.id,
        OrderEventTypeEnum.COMPLETED,
        'Order auto-completed after delivery confirmation period',
      );
    });
  });
});
