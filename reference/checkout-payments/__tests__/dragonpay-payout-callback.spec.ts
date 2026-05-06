import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { NotFoundException } from '@nestjs/common';
import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';

/**
 * TC-WALL-093: seller_withdrawal_completed notification is sent when a
 * wallet withdrawal is auto-completed via the DragonPay payout callback.
 *
 * Root cause of the original bug: handleDragonPayPayoutCallback() called
 * walletWithdrawalRepository.updateStatus() directly (bypassing
 * WalletWithdrawalService.markAsCompleted) so notificationsService.sendWithdrawalCompleted
 * was never reached.  The fix injects WalletRepository and calls the
 * notification inline after the status update.
 */
describe('CheckoutPaymentsService.handleDragonPayPayoutCallback — wallet withdrawal branch', () => {
  let service: CheckoutPaymentsService;

  // ── minimal mocks ──────────────────────────────────────────────────────
  let dragonPayV2Service: any;
  let walletWithdrawalRepository: any;
  let walletRepository: any;
  let notificationsService: any;
  let returnRequestRepository: any;

  const mockWithdrawal = {
    id: 42,
    wallet_id: 7,
    amount: 1500,
    status: WithdrawalStatusEnum.PROCESSING,
    payout_reference: 'DP-REF-PAYOUT-001',
  };

  const mockWallet = {
    id: 7,
    user_id: 3,
    balance: 3500,
  };

  const buildService = () =>
    new CheckoutPaymentsService(
      {} as any, // repository
      {} as any, // membershipPaymentRepository
      {} as any, // checkoutOrdersService
      {} as any, // payMongoService
      notificationsService,
      dragonPayV2Service,
      {} as any, // mayaCheckoutService
      {} as any, // mailService
      {} as any, // salesOrderRepository
      {} as any, // bookingRepository
      returnRequestRepository,
      {} as any, // returnRequestItemRepository
      {} as any, // paymentOrderRepository
      {} as any, // shoppingCartRepository
      {} as any, // shoppingCartItemRepository
      {} as any, // mayaWebhookEventRepository
      {} as any, // salesOrdersService
      {} as any, // membershipsService
      {} as any, // orderTrackingService
      walletWithdrawalRepository,
      {} as any, // walletTransactionService
      walletRepository,
      {} as any, // sellerRepository
      {} as any, // inventoryStocksService
      {} as any, // paymentGatewayResolver
      {} as any, // dataSource
      {} as any, // subscriptionPaymentRepository
      {} as any, // subscriptionPaymentsService
    );

  beforeEach(() => {
    dragonPayV2Service = {
      processPayoutPostback: jest.fn(),
    };
    walletWithdrawalRepository = {
      findByPayoutReference: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    walletRepository = {
      findById: jest.fn(),
    };
    notificationsService = {
      sendWithdrawalCompleted: jest.fn().mockResolvedValue(undefined),
      sendWithdrawalFailed: jest.fn().mockResolvedValue(undefined),
    };
    returnRequestRepository = {
      findOne: jest.fn().mockResolvedValue(null), // not a return-request payout
    };

    service = buildService();
  });

  // ── TC-WALL-093 (the actual regression) ─────────────────────────────────

  describe('status S (success)', () => {
    beforeEach(() => {
      dragonPayV2Service.processPayoutPostback.mockResolvedValue({
        merchantTxnId: 'DP-REF-PAYOUT-001',
        status: 'S',
      });
      walletWithdrawalRepository.findByPayoutReference.mockResolvedValue(
        mockWithdrawal,
      );
      walletRepository.findById.mockResolvedValue(mockWallet);
    });

    it('should mark withdrawal as COMPLETED', async () => {
      await service.handleDragonPayPayoutCallback({
        txnid: 'DP-REF-PAYOUT-001',
      } as any);

      expect(walletWithdrawalRepository.updateStatus).toHaveBeenCalledWith(
        mockWithdrawal.id,
        WithdrawalStatusEnum.COMPLETED,
        expect.objectContaining({ payout_status: 'completed' }),
      );
    });

    it('should send seller_withdrawal_completed notification (TC-WALL-093)', async () => {
      await service.handleDragonPayPayoutCallback({
        txnid: 'DP-REF-PAYOUT-001',
      } as any);

      expect(notificationsService.sendWithdrawalCompleted).toHaveBeenCalledWith(
        mockWallet.user_id,
        mockWithdrawal.id,
        mockWithdrawal.amount,
      );
    });

    it('should still succeed if wallet lookup returns null (notification skipped gracefully)', async () => {
      walletRepository.findById.mockResolvedValue(null);

      await expect(
        service.handleDragonPayPayoutCallback({
          txnid: 'DP-REF-PAYOUT-001',
        } as any),
      ).resolves.toEqual({ result: 'OK' });

      expect(
        notificationsService.sendWithdrawalCompleted,
      ).not.toHaveBeenCalled();
    });

    it('should return { result: "OK" }', async () => {
      const result = await service.handleDragonPayPayoutCallback({
        txnid: 'DP-REF-PAYOUT-001',
      } as any);
      expect(result).toEqual({ result: 'OK' });
    });
  });

  // ── failure statuses ─────────────────────────────────────────────────────

  describe('status F (failed)', () => {
    beforeEach(() => {
      dragonPayV2Service.processPayoutPostback.mockResolvedValue({
        merchantTxnId: 'DP-REF-PAYOUT-001',
        status: 'F',
      });
      walletWithdrawalRepository.findByPayoutReference.mockResolvedValue(
        mockWithdrawal,
      );
    });

    it('should mark withdrawal as FAILED', async () => {
      await service.handleDragonPayPayoutCallback({
        txnid: 'DP-REF-PAYOUT-001',
      } as any);

      expect(walletWithdrawalRepository.updateStatus).toHaveBeenCalledWith(
        mockWithdrawal.id,
        WithdrawalStatusEnum.FAILED,
        expect.objectContaining({ payout_status: 'failed' }),
      );
    });

    it('should NOT send sendWithdrawalCompleted for a failed payout', async () => {
      await service.handleDragonPayPayoutCallback({
        txnid: 'DP-REF-PAYOUT-001',
      } as any);

      expect(
        notificationsService.sendWithdrawalCompleted,
      ).not.toHaveBeenCalled();
    });
  });

  describe('status V (voided)', () => {
    it('should also mark withdrawal as FAILED', async () => {
      dragonPayV2Service.processPayoutPostback.mockResolvedValue({
        merchantTxnId: 'DP-REF-PAYOUT-001',
        status: 'V',
      });
      walletWithdrawalRepository.findByPayoutReference.mockResolvedValue(
        mockWithdrawal,
      );

      await service.handleDragonPayPayoutCallback({
        txnid: 'DP-REF-PAYOUT-001',
      } as any);

      expect(walletWithdrawalRepository.updateStatus).toHaveBeenCalledWith(
        mockWithdrawal.id,
        WithdrawalStatusEnum.FAILED,
        expect.anything(),
      );
    });
  });

  // ── non-terminal status (no update) ─────────────────────────────────────

  describe('status P (pending / in-progress)', () => {
    it('should not call updateStatus for non-terminal status', async () => {
      dragonPayV2Service.processPayoutPostback.mockResolvedValue({
        merchantTxnId: 'DP-REF-PAYOUT-001',
        status: 'P',
      });
      walletWithdrawalRepository.findByPayoutReference.mockResolvedValue(
        mockWithdrawal,
      );

      await service.handleDragonPayPayoutCallback({
        txnid: 'DP-REF-PAYOUT-001',
      } as any);

      expect(walletWithdrawalRepository.updateStatus).not.toHaveBeenCalled();
      expect(
        notificationsService.sendWithdrawalCompleted,
      ).not.toHaveBeenCalled();
    });
  });

  // ── unknown payout reference ──────────────────────────────────────────────

  it('should throw NotFoundException when txnId matches neither a return request nor a withdrawal', async () => {
    dragonPayV2Service.processPayoutPostback.mockResolvedValue({
      merchantTxnId: 'UNKNOWN-REF',
      status: 'S',
    });
    walletWithdrawalRepository.findByPayoutReference.mockResolvedValue(null);

    await expect(
      service.handleDragonPayPayoutCallback({ txnid: 'UNKNOWN-REF' } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
