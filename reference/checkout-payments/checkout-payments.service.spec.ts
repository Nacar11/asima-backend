import { CheckoutPaymentsService } from './checkout-payments.service';

describe('CheckoutPaymentsService', () => {
  it('should route paymaya_direct payments to Maya checkout', async () => {
    const repository = {
      findBySalesOrderId: jest.fn().mockResolvedValue([]),
      findByTransactionNumber: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((payment) => ({
        id: 101,
        ...payment,
      })),
      transitionToAwaitingPaymentIfPending: jest.fn().mockResolvedValue({
        id: 101,
        gateway_checkout_url:
          'https://payments-web-sandbox.maya.ph/v2/checkout?id=test-checkout-id',
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const dragonPayV2Service = {
      mapPaymentMethodToProcessor: jest.fn(),
      createPaymentIntent: jest.fn(),
    };

    const mayaCheckoutService = {
      createCheckoutSession: jest.fn().mockResolvedValue({
        checkoutId: 'co_test_123',
        referenceNumber: 'MAYA-REF-123',
        checkoutUrl:
          'https://payments-web-sandbox.maya.ph/v2/checkout?id=test-checkout-id',
        raw: {},
      }),
    };

    const service = new CheckoutPaymentsService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dragonPayV2Service as any,
      mayaCheckoutService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any, // membershipsService
      {} as any, // walletWithdrawalRepository
      {} as any, // walletTransactionService
      {} as any, // walletRepository
      {} as any, // sellerRepository
      {} as any, // inventoryStocksService
      {
        resolve: jest.fn().mockResolvedValue({
          gatewayName: 'maya',
          initiate: jest.fn().mockResolvedValue({
            gateway: 'maya',
            checkout_url:
              'https://payments-web-sandbox.maya.ph/v2/checkout?id=test-checkout-id',
            qr_image_url: null,
            reference_number: 'MAYA-REF-123',
            requires_manual_confirmation: false,
          }),
          supportsManualConfirmation: jest.fn().mockReturnValue(false),
        }),
      } as any, // paymentGatewayResolver
      {} as any, // dataSource
      {} as any, // subscriptionPaymentRepository
      {} as any, // subscriptionPaymentsService
    );

    const result = await service.initiatePayment(
      {
        sales_order_id: 1,
        payment_method_code: 'paymaya_direct',
        amount: 1000,
        currency_code: 'PHP',
        description: 'Venue booking payment',
      },
      {
        id: 77,
        email: 'guest@example.com',
        first_name: 'Guest',
        last_name: 'User',
      } as any,
    );

    expect(dragonPayV2Service.createPaymentIntent).not.toHaveBeenCalled();
    expect(
      repository.transitionToAwaitingPaymentIfPending,
    ).toHaveBeenCalledWith(
      101,
      'MAYA-REF-123',
      'https://payments-web-sandbox.maya.ph/v2/checkout?id=test-checkout-id',
    );
    expect(result.gateway_checkout_url).toContain(
      'payments-web-sandbox.maya.ph',
    );
  });
});
