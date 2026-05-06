import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { SellerWalletsController } from '@/wallets/controllers/seller-wallets.controller';
import { WalletsService } from '@/wallets/wallets.service';
import { SellerGuard } from '@/users/user.guard';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';
import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';

describe('SellerWalletsController', () => {
  let controller: SellerWalletsController;
  let service: WalletsService;

  const mockRequest = { user: { id: 1 } };

  const mockWallet = {
    id: 1,
    user_id: 1,
    seller_id: 10,
    balance: 5000,
    status: WalletStatusEnum.ACTIVE,
  };

  const mockWithdrawal = {
    id: 1,
    wallet_id: 1,
    amount: 1000,
    status: WithdrawalStatusEnum.PENDING,
  };

  const mockWalletsService = {
    getSellerWallet: jest.fn(),
    getTransactions: jest.fn(),
    requestWithdrawal: jest.fn(),
    listWithdrawals: jest.fn(),
    getWithdrawal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerWalletsController],
      providers: [
        { provide: WalletsService, useValue: mockWalletsService },
        SellerGuard,
        {
          provide: getDataSourceToken(),
          useValue: {
            getRepository: jest.fn().mockReturnValue({
              findOne: jest.fn().mockResolvedValue({ id: 10 }),
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<SellerWalletsController>(SellerWalletsController);
    service = module.get<WalletsService>(WalletsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getWallet ────────────────────────────────────────────────────────────

  describe('getWallet', () => {
    it('should return the seller wallet', async () => {
      mockWalletsService.getSellerWallet.mockResolvedValue(mockWallet);
      const result = await controller.getWallet(mockRequest);
      expect(result).toEqual(mockWallet);
      expect(service.getSellerWallet).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when wallet does not exist', async () => {
      mockWalletsService.getSellerWallet.mockRejectedValue(
        new NotFoundException('Seller wallet not found'),
      );
      await expect(controller.getWallet(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getTransactions ──────────────────────────────────────────────────────

  describe('getTransactions', () => {
    it('should return transactions with query filters', async () => {
      const mockResult = [[{ id: 1, amount: 500 }], 1];
      mockWalletsService.getTransactions.mockResolvedValue(mockResult);
      const query = { page: 1, limit: 10 };
      const result = await controller.getTransactions(
        mockRequest,
        query as any,
      );
      expect(result).toEqual(mockResult);
      expect(service.getTransactions).toHaveBeenCalledWith(1, query);
    });

    it('should return empty result when wallet has no transactions', async () => {
      mockWalletsService.getTransactions.mockResolvedValue([[], 0]);
      const result = await controller.getTransactions(mockRequest, {} as any);
      expect(result).toEqual([[], 0]);
    });
  });

  // ─── requestWithdrawal ────────────────────────────────────────────────────

  describe('requestWithdrawal', () => {
    const dto = { amount: 1000, bank_account_id: 2 };

    it('should create and return a withdrawal request', async () => {
      mockWalletsService.requestWithdrawal.mockResolvedValue(mockWithdrawal);
      const result = await controller.requestWithdrawal(mockRequest, dto);
      expect(result).toEqual(mockWithdrawal);
      expect(service.requestWithdrawal).toHaveBeenCalledWith(1, 1000, 2);
    });

    it('should propagate BadRequestException for insufficient balance', async () => {
      mockWalletsService.requestWithdrawal.mockRejectedValue(
        new BadRequestException('Insufficient available balance'),
      );
      await expect(
        controller.requestWithdrawal(mockRequest, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate ForbiddenException for frozen wallet', async () => {
      mockWalletsService.requestWithdrawal.mockRejectedValue(
        new ForbiddenException('Wallet is frozen'),
      );
      await expect(
        controller.requestWithdrawal(mockRequest, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── listWithdrawals ──────────────────────────────────────────────────────

  describe('listWithdrawals', () => {
    it('should return user withdrawal history', async () => {
      mockWalletsService.listWithdrawals.mockResolvedValue([mockWithdrawal]);
      const result = await controller.listWithdrawals(mockRequest);
      expect(result).toEqual([mockWithdrawal]);
      expect(service.listWithdrawals).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no withdrawals', async () => {
      mockWalletsService.listWithdrawals.mockResolvedValue([]);
      const result = await controller.listWithdrawals(mockRequest);
      expect(result).toEqual([]);
    });
  });

  // ─── getWithdrawal ────────────────────────────────────────────────────────

  describe('getWithdrawal', () => {
    it('should return a specific withdrawal', async () => {
      mockWalletsService.getWithdrawal.mockResolvedValue(mockWithdrawal);
      const result = await controller.getWithdrawal(mockRequest, 1);
      expect(result).toEqual(mockWithdrawal);
      expect(service.getWithdrawal).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException for non-existent withdrawal', async () => {
      mockWalletsService.getWithdrawal.mockRejectedValue(
        new NotFoundException('Withdrawal not found'),
      );
      await expect(controller.getWithdrawal(mockRequest, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when withdrawal belongs to another user', async () => {
      mockWalletsService.getWithdrawal.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );
      await expect(controller.getWithdrawal(mockRequest, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
