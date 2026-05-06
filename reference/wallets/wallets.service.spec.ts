import { WalletsService } from '@/wallets/wallets.service';
import { NotFoundException } from '@nestjs/common';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';

describe('WalletsService', () => {
  let service: WalletsService;
  let walletRepo: any;
  let txRepo: any;
  let txService: any;
  let withdrawalService: any;
  let dataSource: any;

  const mockWallet = {
    id: 1,
    user_id: 1,
    seller_id: 10,
    balance: 5000,
    status: WalletStatusEnum.ACTIVE,
  };

  beforeEach(() => {
    walletRepo = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      createIfNotExists: jest.fn(),
      updateStatus: jest.fn(),
    };
    txRepo = {
      findByWalletId: jest.fn(),
      createAdjustment: jest.fn(),
    };
    txService = {
      creditPendingEarning: jest.fn(),
      confirmEarning: jest.fn(),
      deductReturn: jest.fn(),
    };
    withdrawalService = {
      requestWithdrawal: jest.fn(),
      listByUser: jest.fn(),
      findOneByUser: jest.fn(),
    };
    dataSource = {};

    service = new WalletsService(
      walletRepo,
      txRepo,
      txService,
      withdrawalService,
      dataSource as any,
    );
  });

  describe('creditPendingEarning', () => {
    it('should delegate to txService', async () => {
      txService.creditPendingEarning.mockResolvedValue(undefined);
      await service.creditPendingEarning(10, 100, 2000, 10);
      expect(txService.creditPendingEarning).toHaveBeenCalledWith({
        sellerId: 10,
        salesOrderId: 100,
        grossAmount: 2000,
        commissionRate: 10,
      });
    });
  });

  describe('confirmEarning', () => {
    it('should delegate to txService', async () => {
      txService.confirmEarning.mockResolvedValue(undefined);
      await service.confirmEarning(10, 100);
      expect(txService.confirmEarning).toHaveBeenCalledWith({
        sellerId: 10,
        salesOrderId: 100,
      });
    });
  });

  describe('deductReturn', () => {
    it('should delegate to txService', async () => {
      txService.deductReturn.mockResolvedValue(undefined);
      await service.deductReturn(10, 50, 500);
      expect(txService.deductReturn).toHaveBeenCalledWith({
        sellerId: 10,
        returnRequestId: 50,
        amount: 500,
      });
    });
  });

  describe('getSellerWallet', () => {
    it('should return wallet when found', async () => {
      walletRepo.findByUserId.mockResolvedValue(mockWallet);
      const result = await service.getSellerWallet(1);
      expect(result).toEqual(mockWallet);
      expect(walletRepo.findByUserId).toHaveBeenCalledWith(1);
    });

    it('should auto-create wallet and return it when wallet does not exist but seller does', async () => {
      walletRepo.findByUserId
        .mockResolvedValueOnce(null) // first call: not found
        .mockResolvedValueOnce(mockWallet); // second call: after creation
      walletRepo.createIfNotExists.mockResolvedValue(undefined);
      dataSource.getRepository = jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ s_id: 10 }),
        }),
      });

      const result = await service.getSellerWallet(99);
      expect(result).toEqual(mockWallet);
      expect(walletRepo.createIfNotExists).toHaveBeenCalledWith(99, 10);
    });

    it('should throw NotFoundException when wallet does not exist and user is not a seller', async () => {
      walletRepo.findByUserId.mockResolvedValue(null);
      dataSource.getRepository = jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getSellerWallet(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('ensureSellerWallet', () => {
    it('should call createIfNotExists', async () => {
      walletRepo.createIfNotExists.mockResolvedValue(undefined);
      await service.ensureSellerWallet(1, 10);
      expect(walletRepo.createIfNotExists).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('requestWithdrawal', () => {
    it('should delegate to withdrawalService with correct params', async () => {
      const mockWithdrawal = { id: 1, amount: 1000 };
      withdrawalService.requestWithdrawal.mockResolvedValue(mockWithdrawal);
      const result = await service.requestWithdrawal(1, 1000, 2);
      expect(result).toEqual(mockWithdrawal);
      expect(withdrawalService.requestWithdrawal).toHaveBeenCalledWith({
        userId: 1,
        amount: 1000,
        bank_account_id: 2,
      });
    });
  });

  describe('listWithdrawals', () => {
    it('should return withdrawals from withdrawalService', async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      withdrawalService.listByUser.mockResolvedValue(mockList);
      const result = await service.listWithdrawals(1);
      expect(result).toEqual(mockList);
      expect(withdrawalService.listByUser).toHaveBeenCalledWith(1);
    });
  });

  describe('getWithdrawal', () => {
    it('should return withdrawal from withdrawalService', async () => {
      const mockWithdrawal = { id: 5, amount: 1500 };
      withdrawalService.findOneByUser.mockResolvedValue(mockWithdrawal);
      const result = await service.getWithdrawal(5, 1);
      expect(result).toEqual(mockWithdrawal);
      expect(withdrawalService.findOneByUser).toHaveBeenCalledWith(5, 1);
    });
  });

  describe('getTransactions', () => {
    it('should return empty when wallet does not exist', async () => {
      walletRepo.findByUserId.mockResolvedValue(null);
      const result = await service.getTransactions(99, {});
      expect(result).toEqual([[], 0]);
    });

    it('should return transactions when wallet exists', async () => {
      walletRepo.findByUserId.mockResolvedValue(mockWallet);
      const mockTxs = [[{ id: 1 }], 1];
      txRepo.findByWalletId.mockResolvedValue(mockTxs);
      const result = await service.getTransactions(1, { page: 1, limit: 10 });
      expect(result).toEqual(mockTxs);
      expect(txRepo.findByWalletId).toHaveBeenCalledWith(mockWallet.id, {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('adminListWallets', () => {
    it('should return paginated wallets', async () => {
      const mockResult = [[mockWallet], 1];
      walletRepo.findAll.mockResolvedValue(mockResult);
      const result = await service.adminListWallets({ status: 'ACTIVE' });
      expect(result).toEqual(mockResult);
      expect(walletRepo.findAll).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });
  });

  describe('adminGetWallet', () => {
    it('should return wallet by id', async () => {
      walletRepo.findById.mockResolvedValue(mockWallet);
      const result = await service.adminGetWallet(1);
      expect(result).toEqual(mockWallet);
    });

    it('should throw NotFoundException when not found', async () => {
      walletRepo.findById.mockResolvedValue(null);
      await expect(service.adminGetWallet(999)).rejects.toThrow(
        new NotFoundException('Wallet not found'),
      );
    });
  });

  describe('adminFreezeWallet', () => {
    it('should call updateStatus with FROZEN and reason', async () => {
      walletRepo.updateStatus.mockResolvedValue(undefined);
      await service.adminFreezeWallet(1, 'Suspicious activity');
      expect(walletRepo.updateStatus).toHaveBeenCalledWith(
        1,
        WalletStatusEnum.FROZEN,
        'Suspicious activity',
      );
    });
  });

  describe('adminUnfreezeWallet', () => {
    it('should call updateStatus with ACTIVE and null reason', async () => {
      walletRepo.updateStatus.mockResolvedValue(undefined);
      await service.adminUnfreezeWallet(1);
      expect(walletRepo.updateStatus).toHaveBeenCalledWith(
        1,
        WalletStatusEnum.ACTIVE,
        null,
      );
    });
  });

  describe('adminAdjustWallet', () => {
    it('should call createAdjustment with all params including dataSource', async () => {
      txRepo.createAdjustment.mockResolvedValue(undefined);
      await service.adminAdjustWallet(
        1,
        500,
        TransactionDirectionEnum.CREDIT,
        'Goodwill credit',
      );
      expect(txRepo.createAdjustment).toHaveBeenCalledWith(
        1,
        500,
        TransactionDirectionEnum.CREDIT,
        'Goodwill credit',
        dataSource,
      );
    });
  });
});
