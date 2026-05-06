/**
 * Bug regression: processRefund must reach FULLY_REFUNDED even when
 * total_refunded + refundAmount produces floating-point drift.
 *
 * JavaScript IEEE-754: 1.1 + 2.2 === 3.3000000000000003 (not 3.3).
 * Without Math.round(), isFullyRefunded could be computed as true when the
 * naive sum slightly exceeds `amount`, or as false when it falls just below.
 * The fix rounds to 2 decimal places before comparing.
 */

import { BadRequestException } from '@nestjs/common';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Minimal CheckoutPaymentsService wired only for processRefund tests.
 * payment_gateway is intentionally NOT 'maya' to bypass the Maya API branch.
 */
function buildService(payment: Record<string, any>) {
  const atomicRefund = jest.fn().mockResolvedValue({ ...payment });

  const repository: any = {
    findById: jest.fn().mockResolvedValue(payment),
    atomicRefund,
    update: jest.fn().mockResolvedValue(payment),
  };

  const service = new CheckoutPaymentsService(
    repository,
    {} as any, // membershipPaymentRepository
    {} as any, // checkoutOrdersService
    {} as any, // payMongoService
    {} as any, // notificationsService
    {} as any, // dragonPayV2Service
    {} as any, // mayaCheckoutService
    {} as any, // mailService
    {} as any, // salesOrderRepository
    {} as any, // bookingRepository
    {} as any, // returnRequestRepository
    {} as any, // returnRequestItemRepository
    {} as any, // paymentOrderRepository
    {} as any, // shoppingCartRepository
    {} as any, // shoppingCartItemRepository
    {} as any, // mayaWebhookEventRepository
    {} as any, // salesOrdersService
    {} as any, // membershipsService
    {} as any, // orderTrackingService
    {} as any, // walletWithdrawalRepository
    {} as any, // walletTransactionService
    {} as any, // walletRepository
    {} as any, // sellerRepository
    {} as any, // inventoryStocksService
    {} as any, // paymentGatewayResolver
    {} as any, // dataSource
  );

  return { service, atomicRefund };
}

const mockUser = { id: 1 } as any;

// ─── tests ───────────────────────────────────────────────────────────────────

describe('processRefund — float arithmetic', () => {
  it('marks payment as FULLY_REFUNDED even when float drift makes naive sum fall below amount', async () => {
    // 0.10 + 10.20 = 10.299999999999999 in JS (< 10.30), so WITHOUT rounding,
    // isFullyRefunded would be false even though this IS a full refund.
    const payment = {
      id: 1,
      status: CheckoutPaymentStatusEnum.COMPLETED,
      is_fully_refunded: false,
      payment_gateway: 'gcash',
      amount: 10.30,
      total_refunded: 0.10,
      transaction_number: 'TXN-001',
      gateway_response: null,
    };
    const { service, atomicRefund } = buildService(payment);

    await service.processRefund(1, 10.20, 'test refund', mockUser);

    expect(atomicRefund).toHaveBeenCalledWith(
      1,
      10.20,
      true, // isFullyRefunded must be true — rounding fixes the drift
      CheckoutPaymentStatusEnum.FULLY_REFUNDED,
      mockUser.id,
    );
  });

  it('marks payment as PARTIALLY_REFUNDED for a genuine partial refund', async () => {
    const payment = {
      id: 2,
      status: CheckoutPaymentStatusEnum.COMPLETED,
      is_fully_refunded: false,
      payment_gateway: 'gcash',
      amount: 1000,
      total_refunded: 0,
      transaction_number: 'TXN-002',
      gateway_response: null,
    };
    const { service, atomicRefund } = buildService(payment);

    await service.processRefund(2, 500, 'partial refund', mockUser);

    expect(atomicRefund).toHaveBeenCalledWith(
      2,
      500,
      false, // isFullyRefunded must be false
      CheckoutPaymentStatusEnum.PARTIALLY_REFUNDED,
      mockUser.id,
    );
  });

  it('defaults to full remaining refund when no amount is specified', async () => {
    const payment = {
      id: 3,
      status: CheckoutPaymentStatusEnum.COMPLETED,
      is_fully_refunded: false,
      payment_gateway: 'gcash',
      amount: 500,
      total_refunded: 200,
      transaction_number: 'TXN-003',
      gateway_response: null,
    };
    const { service, atomicRefund } = buildService(payment);

    await service.processRefund(3, undefined, 'full refund', mockUser);

    expect(atomicRefund).toHaveBeenCalledWith(
      3,
      300, // remaining = 500 - 200
      true,
      CheckoutPaymentStatusEnum.FULLY_REFUNDED,
      mockUser.id,
    );
  });

  it('throws when refund amount exceeds remaining balance', async () => {
    const payment = {
      id: 4,
      status: CheckoutPaymentStatusEnum.COMPLETED,
      is_fully_refunded: false,
      payment_gateway: 'gcash',
      amount: 500,
      total_refunded: 400,
      transaction_number: 'TXN-004',
      gateway_response: null,
    };
    const { service } = buildService(payment);

    await expect(
      service.processRefund(4, 200, 'over-refund', mockUser),
    ).rejects.toThrow(BadRequestException);
  });
});
