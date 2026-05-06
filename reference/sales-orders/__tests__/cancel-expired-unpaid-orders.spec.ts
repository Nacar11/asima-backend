/**
 * Bug regression: cancelExpiredUnpaidOrders must use payment expires_at,
 * not order created_at, to determine if a payment window has elapsed.
 *
 * Scenario that was broken:
 *   - Order created recently (e.g. 1 hour ago) → created_at NOT past cutoff
 *   - But payment was initiated earlier and expires_at IS in the past
 *   - Old code: order NOT cancelled (wrong)
 *   - Fixed code: order IS cancelled (correct)
 *
 * The fix uses a JOIN on checkout_payment_orders → checkout_payments and
 * filters on cp.expires_at < now.  We verify the correct WHERE clause is
 * built by controlling what the query builder returns.
 */

import { SalesOrdersSchedulerService } from '@/sales-orders/sales-orders-scheduler.service';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { PaymentStatusEnum } from '@/sales-orders/domain/payment-status.enum';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';

// ─── helpers ────────────────────────────────────────────────────────────────

const makeOrder = (overrides: Record<string, any> = {}) => ({
  id: 1,
  order_number: 'ORD-001',
  status: OrderStatusEnum.PENDING,
  payment_status: PaymentStatusEnum.AWAITING_PAYMENT,
  seller_id: null,
  items: [],
  ...overrides,
});

/**
 * Build the scheduler with mocked repositories.
 * `ordersReturnedByQuery` controls what the QueryBuilder returns — simulating
 * the DB result of the expires_at join query.
 */
function buildScheduler(ordersReturnedByQuery: any[]) {
  const qb: any = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(ordersReturnedByQuery),
  };

  const orderRepository: any = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    find: jest.fn().mockResolvedValue([]),
  };

  const orderTrackingService: any = {
    createEvent: jest.fn().mockResolvedValue(undefined),
  };

  const inventoryStocksService: any = {
    releaseStock: jest.fn().mockResolvedValue(undefined),
  };

  const walletsService: any = {
    confirmEarning: jest.fn().mockResolvedValue(undefined),
  };

  const service = new SalesOrdersSchedulerService(
    orderRepository,
    {} as any, // checkoutPaymentRepository
    {} as any, // checkoutPaymentOrderRepository
    orderTrackingService,
    inventoryStocksService,
    walletsService,
  );

  return { service, orderRepository, orderTrackingService, qb };
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('cancelExpiredUnpaidOrders — uses payment expires_at', () => {
  it('cancels an order when the query returns it as expired', async () => {
    const expiredOrder = makeOrder({ id: 42, order_number: 'ORD-042' });
    const { service, orderRepository, orderTrackingService } =
      buildScheduler([expiredOrder]);

    await service.cancelExpiredUnpaidOrders();

    expect(orderRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42 }),
      expect.objectContaining({ status: OrderStatusEnum.CANCELLED }),
    );
    expect(orderTrackingService.createEvent).toHaveBeenCalledWith(
      42,
      OrderEventTypeEnum.CANCELLED,
      expect.any(String),
    );
  });

  it('does not cancel any orders when query returns empty (no expired payments)', async () => {
    const { service, orderRepository } = buildScheduler([]);

    await service.cancelExpiredUnpaidOrders();

    expect(orderRepository.update).not.toHaveBeenCalled();
  });

  it('builds query using createQueryBuilder with expires_at join, not a plain find()', async () => {
    const { service, orderRepository, qb } = buildScheduler([]);

    await service.cancelExpiredUnpaidOrders();

    // Must use createQueryBuilder (not a plain .find() with created_at filter)
    expect(orderRepository.createQueryBuilder).toHaveBeenCalledWith('o');

    // Must join checkout_payment_orders and checkout_payments
    expect(qb.leftJoin).toHaveBeenCalledWith(
      'checkout_payment_orders',
      'cpo',
      expect.any(String),
    );
    expect(qb.leftJoin).toHaveBeenCalledWith(
      'checkout_payments',
      'cp',
      expect.any(String),
    );

    // The WHERE condition must reference expires_at (not just created_at)
    const andWhereCalls: string[] = qb.andWhere.mock.calls.map(
      (call: any[]) => call[0],
    );
    const expiresAtClause = andWhereCalls.find((clause) =>
      clause.includes('expires_at'),
    );
    expect(expiresAtClause).toBeDefined();
  });

  it('skips cancellation if atomic update finds order already confirmed', async () => {
    const expiredOrder = makeOrder({ id: 10 });
    const { service, orderRepository, orderTrackingService } =
      buildScheduler([expiredOrder]);

    // Simulate race condition: another process confirmed the order first
    orderRepository.update.mockResolvedValue({ affected: 0 });

    await service.cancelExpiredUnpaidOrders();

    // update was attempted but no tracking event should be created
    expect(orderRepository.update).toHaveBeenCalled();
    expect(orderTrackingService.createEvent).not.toHaveBeenCalled();
  });
});
