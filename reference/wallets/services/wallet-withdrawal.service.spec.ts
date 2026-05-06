import { WalletWithdrawalService } from '@/wallets/services/wallet-withdrawal.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';
import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';

describe('WalletWithdrawalService', () => {
  let service: WalletWithdrawalService;
  let walletRepo: any;
  let txRepo: any;
  let withdrawalRepo: any;
  let dataSource: any;
  let notificationsService: any;
  let payoutsService: any;
  let configService: any;

  const mockWallet = {
    id: 1,
    seller_id: 10,
    user_id: 1,
    balance: 5000,
    status: WalletStatusEnum.ACTIVE,
  };

  const mockWithdrawal = {
    id: 1,
    wallet_id: 1,
    wallet_transaction_id: 100,
    amount: 1000,
    status: WithdrawalStatusEnum.PENDING,
  };

  beforeEach(() => {
    walletRepo = {
      findByUserId: jest.fn(),
      findBySellerIdWithLock: jest.fn(),
      findById: jest.fn(),
    };
    txRepo = {
      createTransaction: jest.fn(),
      markCompleted: jest.fn(),
    };
    withdrawalRepo = {
      countTodayByWalletId: jest.fn().mockResolvedValue(0),
      sumTodayByWalletId: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      findById: jest.fn(),
      findByWalletId: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
    };
    notificationsService = {
      sendWithdrawalRequested: jest.fn().mockResolvedValue({}),
      sendWithdrawalProcessing: jest.fn().mockResolvedValue({}),
      sendWithdrawalCompleted: jest.fn().mockResolvedValue({}),
      sendWithdrawalFailed: jest.fn().mockResolvedValue({}),
    };
    payoutsService = { dispatchPayout: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('dragonpay') };
    dataSource = { transaction: jest.fn() };

    service = new WalletWithdrawalService(
      walletRepo,
      txRepo,
      withdrawalRepo,
      dataSource,
      notificationsService,
      payoutsService,
      configService,
    );
  });

  // ─── requestWithdrawal — validation ───────────────────────────────────────

  describe('requestWithdrawal - validation', () => {
    it('should throw if amount below ₱500', async () => {
      await expect(
        service.requestWithdrawal({
          userId: 1,
          amount: 200,
          bank_account_id: 1,
        }),
      ).rejects.toThrow('Minimum withdrawal amount is ₱500');
    });

    it('should throw NotFoundException when wallet does not exist', async () => {
      walletRepo.findByUserId.mockResolvedValue(null);
      await expect(
        service.requestWithdrawal({
          userId: 99,
          amount: 500,
          bank_account_id: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if wallet is frozen', async () => {
      walletRepo.findByUserId.mockResolvedValue({
        ...mockWallet,
        status: WalletStatusEnum.FROZEN,
      });
      await expect(
        service.requestWithdrawal({
          userId: 1,
          amount: 500,
          bank_account_id: 1,
        }),
      ).rejects.toThrow('Wallet is frozen');
    });

    it('should throw if daily count limit of 3 reached', async () => {
      walletRepo.findByUserId.mockResolvedValue(mockWallet);
      dataSource.transaction.mockImplementation((cb: any) => {
        const manager = {
          query: jest.fn().mockResolvedValue([{ next: 1 }]),
          getRepository: jest.fn().mockReturnValue({ update: jest.fn() }),
        };
        walletRepo.findBySellerIdWithLock.mockResolvedValue(mockWallet);
        withdrawalRepo.countTodayByWalletId.mockResolvedValue(3);
        withdrawalRepo.sumTodayByWalletId.mockResolvedValue(0);
        return cb(manager);
      });
      await expect(
        service.requestWithdrawal({
          userId: 1,
          amount: 500,
          bank_account_id: 1,
        }),
      ).rejects.toThrow('Daily withdrawal request limit of 3 reached');
    });

    it('should throw if daily amount limit exceeded', async () => {
      walletRepo.findByUserId.mockResolvedValue({
        ...mockWallet,
        balance: 600_000,
      });
      dataSource.transaction.mockImplementation((cb: any) => {
        const manager = {
          query: jest.fn().mockResolvedValue([{ next: 1 }]),
          getRepository: jest.fn().mockReturnValue({ update: jest.fn() }),
        };
        walletRepo.findBySellerIdWithLock.mockResolvedValue({
          ...mockWallet,
          balance: 600_000,
        });
        withdrawalRepo.countTodayByWalletId.mockResolvedValue(0);
        withdrawalRepo.sumTodayByWalletId.mockResolvedValue(499_999);
        return cb(manager);
      });
      await expect(
        service.requestWithdrawal({
          userId: 1,
          amount: 2000,
          bank_account_id: 1,
        }),
      ).rejects.toThrow('Daily withdrawal limit');
    });

    it('should throw if insufficient balance', async () => {
      walletRepo.findByUserId.mockResolvedValue({
        ...mockWallet,
        balance: 300,
      });
      await expect(
        service.requestWithdrawal({
          userId: 1,
          amount: 500,
          bank_account_id: 1,
        }),
      ).rejects.toThrow('Insufficient available balance');
    });
  });

  describe('requestWithdrawal - happy path', () => {
    it('should create withdrawal and dispatch payout', async () => {
      walletRepo.findByUserId.mockResolvedValue(mockWallet);

      const createdWithdrawal = { ...mockWithdrawal, id: 7 };
      const lockedWallet = { ...mockWallet, balance: 5000 };

      dataSource.transaction.mockImplementation((cb: any) => {
        const manager = {
          query: jest.fn().mockResolvedValue([{ next: 1 }]),
          getRepository: jest.fn().mockReturnValue({ update: jest.fn() }),
        };
        walletRepo.findBySellerIdWithLock.mockResolvedValue(lockedWallet);
        withdrawalRepo.countTodayByWalletId.mockResolvedValue(0);
        withdrawalRepo.sumTodayByWalletId.mockResolvedValue(0);
        txRepo.createTransaction.mockResolvedValue({ id: 100 });
        withdrawalRepo.create.mockResolvedValue(createdWithdrawal);
        return cb(manager);
      });

      payoutsService.dispatchPayout.mockResolvedValue({
        status: 'processing',
        providerTxnId: 'DP-REF-001',
      });

      const result = await service.requestWithdrawal({
        userId: 1,
        amount: 1000,
        bank_account_id: 2,
      });

      expect(result).toEqual(createdWithdrawal);
      expect(payoutsService.dispatchPayout).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          recipientUserId: 1,
          bankAccountId: 2,
        }),
      );
    });

    it('should reverse wallet debit and mark FAILED when dispatchPayout throws', async () => {
      walletRepo.findByUserId.mockResolvedValue(mockWallet);

      const walletUpdateMock = jest.fn();
      const txUpdateMock = jest.fn();
      const compensatingUpdate = jest.fn();
      const getOneMock = jest.fn().mockResolvedValue({
        ...mockWallet,
        balance: 4000, // post-debit balance; refund brings back to 5000
      });
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getOne: getOneMock,
      };

      let txCallCount = 0;
      dataSource.transaction.mockImplementation((cb: any) => {
        txCallCount += 1;
        if (txCallCount === 1) {
          // Initial debit transaction
          const manager = {
            query: jest.fn().mockResolvedValue([{ next: 1 }]),
            getRepository: jest
              .fn()
              .mockReturnValue({ update: walletUpdateMock }),
          };
          walletRepo.findBySellerIdWithLock.mockResolvedValue(mockWallet);
          withdrawalRepo.countTodayByWalletId.mockResolvedValue(0);
          withdrawalRepo.sumTodayByWalletId.mockResolvedValue(0);
          txRepo.createTransaction.mockResolvedValue({ id: 100 });
          withdrawalRepo.create.mockResolvedValue(mockWithdrawal);
          return cb(manager);
        }
        // Compensating transaction after dispatch failure
        const manager = {
          getRepository: jest.fn((entity: any) => {
            if (entity?.name === 'WalletEntity' || entity === undefined) {
              return {
                update: compensatingUpdate,
                createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
              };
            }
            return {
              update: txUpdateMock,
              createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
            };
          }),
        };
        return cb(manager);
      });

      payoutsService.dispatchPayout.mockRejectedValue(
        new Error('DragonPay timeout'),
      );

      const result = await service.requestWithdrawal({
        userId: 1,
        amount: 1000,
        bank_account_id: 2,
      });

      // Still returns the withdrawal domain object (seller sees it in history, now FAILED)
      expect(result).toEqual(mockWithdrawal);

      // Pessimistic lock acquired during compensation
      expect(queryBuilderMock.setLock).toHaveBeenCalledWith(
        'pessimistic_write',
      );

      // Withdrawal transitioned to FAILED with payout provider context
      expect(withdrawalRepo.updateStatus).toHaveBeenCalledWith(
        mockWithdrawal.id,
        WithdrawalStatusEnum.FAILED,
        expect.objectContaining({ payout_provider: 'dragonpay' }),
        expect.anything(),
      );
    });
  });

  // ─── listByUser ───────────────────────────────────────────────────────────

  describe('listByUser', () => {
    it('should return empty array when wallet not found', async () => {
      walletRepo.findByUserId.mockResolvedValue(null);
      const result = await service.listByUser(99);
      expect(result).toEqual([]);
    });

    it('should return withdrawals list for the wallet', async () => {
      walletRepo.findByUserId.mockResolvedValue(mockWallet);
      withdrawalRepo.findByWalletId.mockResolvedValue([[mockWithdrawal], 1]);
      const result = await service.listByUser(1);
      expect(result).toEqual([mockWithdrawal]);
      expect(withdrawalRepo.findByWalletId).toHaveBeenCalledWith(
        mockWallet.id,
        {},
      );
    });
  });

  // ─── findOneByUser ────────────────────────────────────────────────────────

  describe('findOneByUser', () => {
    it('should throw NotFoundException when withdrawal not found', async () => {
      withdrawalRepo.findById.mockResolvedValue(null);
      await expect(service.findOneByUser(999, 1)).rejects.toThrow(
        new NotFoundException('Withdrawal not found'),
      );
    });

    it('should throw ForbiddenException when wallet belongs to different user', async () => {
      withdrawalRepo.findById.mockResolvedValue(mockWithdrawal);
      walletRepo.findById.mockResolvedValue({ ...mockWallet, user_id: 99 });
      await expect(service.findOneByUser(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when wallet not found at all', async () => {
      withdrawalRepo.findById.mockResolvedValue(mockWithdrawal);
      walletRepo.findById.mockResolvedValue(null);
      await expect(service.findOneByUser(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return withdrawal when ownership matches', async () => {
      withdrawalRepo.findById.mockResolvedValue(mockWithdrawal);
      walletRepo.findById.mockResolvedValue(mockWallet);
      const result = await service.findOneByUser(1, 1);
      expect(result).toEqual(mockWithdrawal);
    });
  });

  // ─── markAsProcessing ─────────────────────────────────────────────────────

  describe('markAsProcessing', () => {
    it('should throw NotFoundException when withdrawal not found', async () => {
      withdrawalRepo.findById.mockResolvedValue(null);
      await expect(service.markAsProcessing(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when not PENDING', async () => {
      withdrawalRepo.findById.mockResolvedValue({
        ...mockWithdrawal,
        status: WithdrawalStatusEnum.PROCESSING,
      });
      await expect(service.markAsProcessing(1)).rejects.toThrow(
        'Only pending withdrawals can be marked as processing',
      );
    });

    it('should update status to PROCESSING when PENDING', async () => {
      withdrawalRepo.findById.mockResolvedValue(mockWithdrawal);
      withdrawalRepo.updateStatus.mockResolvedValue(undefined);
      await service.markAsProcessing(1);
      expect(withdrawalRepo.updateStatus).toHaveBeenCalledWith(
        1,
        WithdrawalStatusEnum.PROCESSING,
        expect.objectContaining({ processed_at: expect.any(Date) }),
      );
    });
  });

  // ─── markAsCompleted ──────────────────────────────────────────────────────

  describe('markAsCompleted', () => {
    it('should throw NotFoundException when withdrawal not found', async () => {
      withdrawalRepo.findById.mockResolvedValue(null);
      await expect(service.markAsCompleted(999, 'REF-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when not PENDING or PROCESSING', async () => {
      withdrawalRepo.findById.mockResolvedValue({
        ...mockWithdrawal,
        status: WithdrawalStatusEnum.COMPLETED,
      });
      await expect(service.markAsCompleted(1, 'REF-001')).rejects.toThrow(
        'Only pending or processing withdrawals can be completed',
      );
    });

    it('should complete withdrawal and mark linked tx', async () => {
      const processingWithdrawal = {
        ...mockWithdrawal,
        status: WithdrawalStatusEnum.PROCESSING,
      };
      withdrawalRepo.findById.mockResolvedValue(processingWithdrawal);

      dataSource.transaction.mockImplementation((cb: any) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue(mockWallet),
          }),
        };
        walletRepo.findById.mockResolvedValue(mockWallet);
        txRepo.markCompleted.mockResolvedValue(undefined);
        return cb(manager);
      });

      await service.markAsCompleted(1, 'BANK-REF-123');

      expect(withdrawalRepo.updateStatus).toHaveBeenCalledWith(
        1,
        WithdrawalStatusEnum.COMPLETED,
        expect.objectContaining({ bank_reference_number: 'BANK-REF-123' }),
        expect.anything(),
      );
    });
  });

  // ─── markAsFailed ─────────────────────────────────────────────────────────

  describe('markAsFailed', () => {
    it('should throw NotFoundException when withdrawal not found', async () => {
      withdrawalRepo.findById.mockResolvedValue(null);
      await expect(service.markAsFailed(999, 'error')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when already COMPLETED', async () => {
      withdrawalRepo.findById.mockResolvedValue({
        ...mockWithdrawal,
        status: WithdrawalStatusEnum.COMPLETED,
      });
      await expect(service.markAsFailed(1, 'error')).rejects.toThrow(
        'Only pending or processing withdrawals can be failed',
      );
    });

    it('should refund balance and mark as FAILED from PENDING', async () => {
      withdrawalRepo.findById.mockResolvedValue(mockWithdrawal);

      dataSource.transaction.mockImplementation((cb: any) => {
        const walletEntityRepo = {
          update: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockWallet),
          }),
        };
        const manager = {
          getRepository: jest.fn().mockReturnValue(walletEntityRepo),
        };
        walletRepo.findById.mockResolvedValue(mockWallet);
        return cb(manager);
      });

      await service.markAsFailed(1, 'Bank rejected');

      expect(withdrawalRepo.updateStatus).toHaveBeenCalledWith(
        1,
        WithdrawalStatusEnum.FAILED,
        expect.objectContaining({ failure_reason: 'Bank rejected' }),
        expect.anything(),
      );
    });

    it('should refund balance and mark as FAILED from PROCESSING', async () => {
      withdrawalRepo.findById.mockResolvedValue({
        ...mockWithdrawal,
        status: WithdrawalStatusEnum.PROCESSING,
      });

      dataSource.transaction.mockImplementation((cb: any) => {
        const walletEntityRepo = {
          update: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockWallet),
          }),
        };
        const manager = {
          getRepository: jest.fn().mockReturnValue(walletEntityRepo),
        };
        walletRepo.findById.mockResolvedValue(mockWallet);
        return cb(manager);
      });

      await service.markAsFailed(1, 'Timeout');

      expect(withdrawalRepo.updateStatus).toHaveBeenCalledWith(
        1,
        WithdrawalStatusEnum.FAILED,
        expect.objectContaining({ failure_reason: 'Timeout' }),
        expect.anything(),
      );
    });
  });

  // ─── listAll ──────────────────────────────────────────────────────────────

  describe('listAll', () => {
    it('should return paginated withdrawals', async () => {
      const mockResult: [any[], number] = [[mockWithdrawal], 1];
      withdrawalRepo.findAll.mockResolvedValue(mockResult);
      const result = await service.listAll({ status: 'PENDING' });
      expect(result).toEqual(mockResult);
      expect(withdrawalRepo.findAll).toHaveBeenCalledWith({
        status: 'PENDING',
      });
    });
  });
});
